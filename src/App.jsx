import React, { useEffect, useMemo, useState } from "react";

const VALID_USER = "admin";
const VALID_PASS = "sabi23";

const defaultBooks = [
    { id: "1", title: "The Great Gatsby", author: "F. Scott Fitzgerald", genre: "Fiction", isbn: "9780743273565", qty: 5 },
    { id: "2", title: "1984", author: "George Orwell", genre: "Dystopian", isbn: "9780451524935", qty: 1 }
];

const defaultUsers = [
    { id: "U1", name: "Alice Smith", mid: "M001", role: "Librarian" }
];

function load(key, fallback) {
    try {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : fallback;
    } catch {
        return fallback;
    }
}

function App() {
    const [loggedIn, setLoggedIn] = useState(
        sessionStorage.getItem("isLoggedIn") === "true"
    );
    const [username, setUsername] = useState(
        sessionStorage.getItem("username") || ""
    );
    const [books, setBooks] = useState(() => load("lib_books", defaultBooks));
    const [users, setUsers] = useState(() => load("lib_users", defaultUsers));
    const [transactions, setTransactions] = useState(() => load("lib_tx", []));
    const [tab, setTab] = useState("dashboard");

    useEffect(() => {
        localStorage.setItem("lib_books", JSON.stringify(books));
        localStorage.setItem("lib_users", JSON.stringify(users));
        localStorage.setItem("lib_tx", JSON.stringify(transactions));
    }, [books, users, transactions]);

    function login() {
        const user = window.prompt("Enter Library Username:");
        const pass = window.prompt("Enter Password:");

        if (user === VALID_USER && pass === VALID_PASS) {
            sessionStorage.setItem("isLoggedIn", "true");
            sessionStorage.setItem("username", user);
            setUsername(user);
            setLoggedIn(true);
        } else {
            window.alert("Access Denied: Invalid credentials.");
        }
    }

    useEffect(() => {
        if (!loggedIn) login();
        // Intentionally mirrors the original prompt-based login workflow.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function logout() {
        sessionStorage.clear();
        setLoggedIn(false);
        setUsername("");
    }

    function addBook(event) {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        setBooks(prev => [...prev, {
            id: Date.now().toString(),
            title: form.get("title"),
            author: form.get("author"),
            genre: form.get("genre"),
            isbn: form.get("isbn"),
            qty: parseInt(form.get("qty"), 10)
        }]);
        event.currentTarget.reset();
    }

    function deleteBook(id) {
        setBooks(prev => prev.filter(book => book.id !== id));
    }

    function editBook(id) {
        const book = books.find(item => item.id === id);
        if (!book) return;

        const title = window.prompt("Edit Title:", book.title);
        const author = window.prompt("Edit Author:", book.author);
        const genre = window.prompt("Edit Genre:", book.genre);
        const isbn = window.prompt("Edit ISBN:", book.isbn);

        if (title && author && genre && isbn) {
            setBooks(prev => prev.map(item =>
                item.id === id ? { ...item, title, author, genre, isbn } : item
            ));
        }
    }

    function addUser(event) {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        setUsers(prev => [...prev, {
            id: Date.now().toString(),
            name: form.get("name"),
            mid: form.get("mid"),
            role: form.get("role")
        }]);
        event.currentTarget.reset();
    }

    function deleteUser(id) {
        setUsers(prev => prev.filter(user => user.id !== id));
    }

    function editUser(id) {
        const user = users.find(item => item.id === id);
        if (!user) return;

        const name = window.prompt("Edit Name:", user.name);
        const mid = window.prompt("Edit Membership ID:", user.mid);
        const role = window.prompt("Edit Role (Librarian/Member):", user.role);

        if (name && mid && role) {
            setUsers(prev => prev.map(item =>
                item.id === id ? { ...item, name, mid, role } : item
            ));
        }
    }

    function processTransaction(event) {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const bookId = form.get("book");
        const type = form.get("type");
        const qty = parseInt(form.get("qty"), 10);
        const book = books.find(item => item.id === bookId);

        if (!book) return;

        if (type === "deduct" && book.qty < qty) {
            window.alert("Transaction Failed: Not enough stock to borrow.");
            return;
        }

        setBooks(prev => prev.map(item =>
            item.id === bookId
                ? { ...item, qty: type === "add" ? item.qty + qty : item.qty - qty }
                : item
        ));

        setTransactions(prev => [{
            timestamp: new Date().toLocaleString(),
            log: `${type === "add" ? "ADDED" : "DEDUCTED"} ${qty} copy/copies of "${book.title}"`
        }, ...prev]);

        event.currentTarget.reset();
    }

    if (!loggedIn) {
        return (
            <div style={{ textAlign: "center", marginTop: "20vh", fontFamily: "sans-serif" }}>
                <h2>Restricted System</h2>
                <p>Authentication required.</p>
                <button onClick={login}>Retry Login</button>
            </div>
        );
    }

    return (
        <div id="app">
            <nav id="tabContainer">
                {[
                    ["dashboard", "Dashboard"],
                    ["books", "Book Management"],
                    ["transactions", "Transactions"],
                    ["users", "User Management"]
                ].map(([value, label]) => (
                    <button
                        key={value}
                        className={`tab-btn ${tab === value ? "active" : ""}`}
                        onClick={() => setTab(value)}
                    >
                        {label}
                    </button>
                ))}
                <button className="tab-btn" id="logoutBtn" onClick={logout}>
                    Logout (<span>{username}</span>)
                </button>
            </nav>

            {tab === "dashboard" && (
                <section className="page">
                    <h2>Library Dashboard</h2>
                    <div id="dashboardContainer">
                        <table id="dashboardTable">
                            <thead>
                                <tr>
                                    <th>Title</th><th>Author</th><th>Genre</th>
                                    <th>ISBN</th><th>Quantity</th><th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {books.map(book => {
                                    const low = book.qty < 2;
                                    return (
                                        <tr key={book.id} className={low ? "low-stock" : ""}>
                                            <td>{book.title}</td><td>{book.author}</td>
                                            <td>{book.genre}</td><td>{book.isbn}</td>
                                            <td>{book.qty}</td>
                                            <td>{book.qty > 0 ? "Available" : "Out of Stock"}{low ? " Low" : ""}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}

            {tab === "books" && (
                <section className="page">
                    <h2>Manage Books</h2>
                    <form id="addBookForm" onSubmit={addBook}>
                        <input name="title" type="text" placeholder="Book Title" required />
                        <input name="author" type="text" placeholder="Author" required />
                        <input name="genre" type="text" placeholder="Genre" required />
                        <input name="isbn" type="text" placeholder="ISBN" required />
                        <input name="qty" type="number" placeholder="Initial Quantity" min="0" required />
                        <button type="submit">Save Book</button>
                    </form>
                    <table id="booksTable">
                        <thead>
                            <tr><th>Title</th><th>Author</th><th>Genre</th><th>ISBN</th><th>Qty</th><th>Actions</th></tr>
                        </thead>
                        <tbody>
                            {books.map(book => (
                                <tr key={book.id}>
                                    <td>{book.title}</td><td>{book.author}</td><td>{book.genre}</td>
                                    <td>{book.isbn}</td><td>{book.qty}</td>
                                    <td>
                                        <button onClick={() => editBook(book.id)}>Update</button>
                                        <button
                                            onClick={() => deleteBook(book.id)}
                                            style={{ background: "#dc3545", color: "white" }}
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>
            )}

            {tab === "transactions" && (
                <section className="page">
                    <h2>Inventory Transactions</h2>
                    <form id="transactionForm" onSubmit={processTransaction}>
                        <select name="book" required defaultValue="">
                            <option value="">-- Select Book --</option>
                            {books.map(book => (
                                <option key={book.id} value={book.id}>
                                    {book.title} (Stock: {book.qty})
                                </option>
                            ))}
                        </select>
                        <select name="type" required defaultValue="add">
                            <option value="add">Add Stock (Arrival)</option>
                            <option value="deduct">Deduct Stock (Borrowed)</option>
                        </select>
                        <input name="qty" type="number" placeholder="Amount" min="1" required />
                        <button type="submit">Process Transaction</button>
                    </form>
                    <h3>History Log</h3>
                    <div
                        id="transactionLog"
                        style={{ maxHeight: "200px", overflowY: "auto", background: "#fafafa", padding: "10px", border: "1px solid #ddd" }}
                    >
                        {transactions.map((transaction, index) => (
                            <div className="log-entry" key={`${transaction.timestamp}-${index}`}>
                                <strong>[{transaction.timestamp}]</strong> {transaction.log}
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {tab === "users" && (
                <section className="page">
                    <h2>Manage Users</h2>
                    <form id="addUserForm" onSubmit={addUser}>
                        <input name="name" type="text" placeholder="Full Name" required />
                        <input name="mid" type="text" placeholder="Membership ID" required />
                        <select name="role" required defaultValue="Librarian">
                            <option value="Librarian">Librarian</option>
                            <option value="Member">Member</option>
                        </select>
                        <button type="submit">Save User</button>
                    </form>
                    <table id="usersTable">
                        <thead>
                            <tr><th>Name</th><th>Membership ID</th><th>Role</th><th>Actions</th></tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user.id}>
                                    <td>{user.name}</td><td>{user.mid}</td><td>{user.role}</td>
                                    <td>
                                        <button onClick={() => editUser(user.id)}>Update</button>
                                        <button
                                            onClick={() => deleteUser(user.id)}
                                            style={{ background: "#dc3545", color: "white" }}
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>
            )}
        </div>
    );
}

export default App;
