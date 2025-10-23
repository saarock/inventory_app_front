import React, { useState, useEffect } from 'react';
import './BookedProductComp.css';
import productService from '../../services/productService';
import useUser from "../../hooks/useUser";
import LoadingSpinner from "../LoadingSpinner/LoadingSpinner";
import { FaCheckCircle, FaTimesCircle, FaCog } from 'react-icons/fa'; // Import icons
import { toast } from "react-toastify";

const BookedProductComp = () => {
    const [bookedProducts, setBookedProducts] = useState([]); // Holds the booked products
    const [loading, setLoading] = useState(false); // Loading state for UI
    const [error, setError] = useState(null); // Error state
    const [page, setPage] = useState(1); // Current page
    const [limit, setLimit] = useState(10); // Number of products per page
    const [status, setStatus] = useState('pending'); // Status filter (pending, completed, etc.)
    const [search, setSearch] = useState(''); // Search term for product names
    const { user } = useUser(); // Assuming useUser hook provides the logged-in user
    const [totalPages, setTotalPages] = useState(1); // Total pages for pagination
    const [prevStatus, setPreStatus] = useState("");




    useEffect(() => {
        const fetchBookedProducts = async () => {
            setLoading(true);
            setError(null);
            if (status !== prevStatus) {
                setPage(1)
            }


            try {
                toast.success(`${status} bills.`)
                const data = await productService.getBookedProduct(status !== prevStatus ? 1 : page, limit, status, search, user?._id); // Using user._id here
                setBookedProducts(data.data);
                setTotalPages(data.pagination.totalPages); // Set total pages for pagination
            } catch (err) {
                setError(err.message || "Something went wrong");
            } finally {
                setLoading(false);
                setPreStatus(status);
            }
        };

        fetchBookedProducts();
    }, [page, limit, status, search, user?._id]); // Fetch data on page change, status, etc.

    const handleChangeStatus = async (productId, newStatus) => {
        try {
            await productService.updateProductStatus(productId, newStatus); // Call API to update the status
            setBookedProducts((prevProducts) =>
                prevProducts.map((product) =>
                    product._id === productId ? { ...product, status: newStatus } : product
                )
            );
            toast.success(`Status updated to ${newStatus}`);
        } catch (err) {
            setError(err.message || "Failed to update status");
        }
    };

    const handleGenerateBill = (product) => {
        // Create the bill content (HTML)
        const billContent = `
            <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; }
                        .bill-container { padding: 20px; }
                        .bill-header { text-align: center; }
                        .bill-info { margin-top: 20px; }
                        .bill-footer { margin-top: 30px; text-align: center; }
                        .bill-details { margin-bottom: 10px; }
                    </style>
                </head>
                <body>
                    <div class="bill-container">
                        <div class="bill-header">
                            <h1>Product Bill</h1>
                            <p><strong>Product Name:</strong> ${product.product.name}</p>
                            <p><strong>Booked By:</strong> ${product.user?.userName}</p>
                        </div>
                        <div class="bill-info">
                            <p><strong>Price:</strong> Rs: ${product.price}</p>
                            <p><strong>Status:</strong> ${product.status}</p>
                        </div>
                        <div class="bill-footer">
                            <p>Thank you for booking with us!</p>
                        </div>
                    </div>
                </body>
            </html>
        `;

        // Open the bill content in a new window and print
        const printWindow = window.open('', '_blank');
        printWindow.document.write(billContent);
        printWindow.document.close();
        printWindow.print();
    };

    const generateTotalBill = async (userId, status) => {
        try {
            alert(status)

            const billData = await productService.generateBill(userId, status)
            console.log(billData)
            handleGenerateFullBill(billData.data)
        } catch (error) {
            setError(error.message);
        }
    }

    const handleGenerateFullBill = (billData) => {
        const { allTheDetails, anotherPrice, userName } = billData;


        // Generate table rows for each item
        const itemRows = allTheDetails.map((item, index) => `
            <tr>
                <td>${index + 1}</td>
                <td>Rs. ${item.perPPrice}</td>
                <td>${item.totalItems}</td>
                <td>Rs. ${item.soTheMultiPrice}</td>
                <td>Rs. ${item.status}</td>
            </tr>
        `).join("");

        // Build the bill HTML
        const billContent = `
            <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 20px; }
                        h1, h2 { text-align: center; }
                        table {
                            width: 100%;
                            border-collapse: collapse;
                            margin-top: 20px;
                        }
                        th, td {
                            border: 1px solid #ddd;
                            padding: 8px;
                            text-align: center;
                        }
                        th {
                            background-color: #f2f2f2;
                        }
                        .footer {
                            margin-top: 30px;
                            text-align: center;
                            font-weight: bold;
                        }
                    </style>
                </head>
                <body>
                    <h1>Food track</h1>
                    <h2>🧾 Final Bill</h2>
                    <h3>BookedBy: ${userName}</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Per Item Price</th>
                                <th>Quantity</th>
                                <th>Total</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${itemRows}
                        </tbody>
                    </table>
                    <div class="footer">
                        <p>Total Amount: Rs. ${anotherPrice}</p>
                        <p>Thank you for your purchase!</p>
                    </div>
                </body>
            </html>
        `;

        // Open and print
        const printWindow = window.open('', '_blank');
        printWindow.document.write(billContent);
        printWindow.document.close();
        printWindow.print();
    };

    return (
        <div className="booked-product-comp">
            {/* Search Bar */}
            <div className="search-bar">

                {
                    user && user?.role === "admin" ?
                        <input
                            type="text"
                            placeholder="Search by User Name"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="search-input"
                        /> : <input
                            type="text"
                            placeholder="Search by Product Name"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="search-input"
                        />
                }
                <div className="buttons">
                    <button onClick={() => { setStatus("pending") }}>Pending</button>
                    <button onClick={() => { setStatus("completed") }}>Completed</button>
                    <button onClick={() => { setStatus("cancelled") }}>Cancelled</button>
                </div>
            </div>

            {/* Loading and Error Handling *
            {loading && <LoadingSpinner />}
            {error && <div className="error">{error}</div>}

            {/* Displaying Booked Products */}
            <div className="product-list">
                {bookedProducts?.length > 0 ? (
                    bookedProducts.map((product, index) => (
                        
                        <div key={index} className="product-item">
                          
                            <div className="product-info">
                                <h3>{product.productName}</h3>
                                <p>Booked by: {product.user?.userName}</p>
                                <p>Total Items: {product.totalItems}</p>
                                <p>Product Name: {product.product?.name}</p>
                                <p>Status: {product.status}</p>
                            </div>
                            <div className="product-price">
                                <span>Rs: {product.price}</span>
                            </div>

                            {/* Only show the status change buttons if the user is an admin */}
                            {user?.role === "admin" && (
                                <div className="product-actions">
                                    <button
                                        className="status-btn"
                                        disabled={status === "pending"}
                                        style={{ cursor: status === "pending" ? "no-drop" : "pointer" }}
                                        onClick={() => {
                                            handleChangeStatus(product._id, 'pending')
                                        }}
                                    >
                                        <FaCog /> Pending
                                    </button>
                                    <button
                                        className="status-btn"
                                        disabled={status === "completed"}
                                        style={{ cursor: status === "completed" ? "no-drop" : "pointer" }}
                                        onClick={() => {
                                            handleChangeStatus(product._id, 'completed')
                                        }}
                                    >
                                        <FaCheckCircle /> Completed
                                    </button>
                                    <button
                                        disabled={status === "cancelled"}
                                        style={{ cursor: status === "cancelled" ? "no-drop" : "pointer" }}
                                        className="status-btn"
                                        onClick={() => {
                                            handleChangeStatus(product._id, 'cancelled')
                                        }}
                                    >
                                        <FaTimesCircle /> Cancelled
                                    </button>
                                    <button

                                        className="status-btn"
                                        onClick={() => handleGenerateBill(product)}
                                    >
                                        <FaCheckCircle /> Generate Bill
                                    </button>
                                    <button
                                        className="status-btn"
                                        onClick={() => generateTotalBill(product.user._id, product.status)}
                                    >
                                        <FaCheckCircle /> Generate total Bill for {product.user?.userName}
                                    </button>
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="no-products">No booked products found</div>
                )}
            </div>

            {/* Pagination Controls */}
            <div className="pagination">
                <button
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                    className="pagination-btn"
                >
                    Previous
                </button>
                <span className="page-number">{page}</span>
                <button
                    disabled={page === totalPages || bookedProducts?.length <= 0}
                    onClick={() => setPage(page + 1)}
                    className="pagination-btn"
                >
                    Next
                </button>
            </div>
        </div>
    );
};

export default BookedProductComp;
