import React from 'react';

export default function Footer() {
  return (
    <footer className="footer" id="main-footer">
      <div className="footer-inner">
        <div>
          <strong>TechStore</strong> &copy; {new Date().getFullYear()} — E-Commerce Checkout & Payment System
        </div>
      </div>
    </footer>
  );
}
