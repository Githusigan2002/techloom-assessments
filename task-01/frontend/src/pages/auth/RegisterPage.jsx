import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Alert from "../../components/common/Alert";

export const RegisterPage = () => {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [role, setRole] = useState("user");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const { register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!username.trim() || !email.trim() || !password.trim()) {
            setError("All fields are required");
            return;
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        try {
            setLoading(true);
            const data = await register(username, email, password, role);
            if (data.user?.role === "admin") {
                navigate("/admin");
            } else {
                navigate("/products");
            }
        } catch (err) {
            console.error("Registration failed:", err);
            setError(err.response?.data?.message || "Registration failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="text-center mb-6">
                    <span className="inline-block bg-gray-900 text-white px-2.5 py-1 rounded text-sm font-mono font-bold">
                        POS
                    </span>
                    <h2 className="mt-2 text-2xl font-bold text-gray-900 tracking-tight">
                        Create a new account
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">POS Order & Inventory Management</p>
                </div>

                <div className="bg-white py-8 px-6 border border-gray-200 rounded sm:px-10">
                    <Alert type="error" message={error} onClose={() => setError("")} />

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Username
                            </label>
                            <input
                                type="text"
                                required
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                                placeholder="johndoe"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Email address
                            </label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                                placeholder="name@company.com"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Password
                            </label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                                placeholder="Minimum 6 characters"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Confirm Password
                            </label>
                            <input
                                type="password"
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                                placeholder="Re-enter password"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Account Role
                            </label>
                            <select
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 bg-white"
                            >
                                <option value="user">User / Cashier</option>
                                <option value="admin">Administrator</option>
                            </select>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gray-900 hover:bg-black text-white font-medium py-2 px-4 rounded text-sm transition-colors disabled:opacity-50 mt-2"
                        >
                            {loading ? "Registering..." : "Create Account"}
                        </button>
                    </form>

                    <div className="mt-6 text-center text-xs text-gray-600 border-t border-gray-200 pt-4">
                        Already have an account?{" "}
                        <Link to="/login" className="text-blue-600 hover:underline font-medium">
                            Sign in here
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
