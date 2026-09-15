import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "../components/common/Navbar";

export const MainLayout = () => {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar />
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <Outlet />
            </main>
            <footer className="bg-white border-t border-gray-200 py-4 text-center text-xs text-gray-500">
                POS Order & Inventory Management System &copy; {new Date().getFullYear()}
            </footer>
        </div>
    );
};

export default MainLayout;
