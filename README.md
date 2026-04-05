# Smart Medico-Legal System with Blockchain Verification

## 📌 Project Overview

The Smart Medico-Legal System is a secure digital platform designed to manage medico-legal case reports between hospitals, police departments, and judicial authorities.
This system ensures that medical case reports are stored securely and verified using blockchain technology to prevent tampering.

The platform allows authorized users such as doctors, patients, and judges to access and manage medico-legal reports in a transparent and secure environment.

---

## 🎯 Objectives

* Digitize medico-legal case report management
* Prevent data tampering using blockchain verification
* Provide secure access for doctors, patients, and judges
* Enable quick report generation and download
* Improve transparency in medico-legal case handling

---

## 🚀 Features

* 👨‍⚕️ **Doctor Dashboard** – Create and upload medico-legal reports
* 🧑‍⚖️ **Judge Dashboard** – Verify and approve medico-legal reports
* 🧑‍💼 **Patient Dashboard** – View and download case reports
* 🔐 **Secure Authentication System** – Role-based login system
* ⛓ **Blockchain Verification** – Ensures report integrity and tamper detection
* 📄 **PDF Report Generation** – Download medico-legal reports in PDF format
* 🛡 **Tamper Detection** – Identifies if case data has been modified

---

## 🛠 Technologies Used

### Frontend

* React.js
* HTML
* CSS
* JavaScript

### Backend

* Node.js
* Express.js

### Database

* MongoDB

### Security

* Blockchain hashing for report verification

---

## ⚙ Installation

1. Clone the repository

```
git clone https://github.com/yourusername/your-repository-name.git
```

2. Navigate to project folder

```
cd your-repository-name
```

3. Install dependencies

```
npm install
```

4. Start backend server

```
cd backend
npm start
```

5. Start frontend

```
cd frontend
npm start
```

---

## 🧪 Testing

The system includes tamper detection testing.

Two cases can be tested:

* **Not Tampered Data** – Report hash matches blockchain record
* **Tampered Data** – System detects modification in report data

---

## 📊 Workflow

1. Doctor creates medico-legal case report
2. Report is stored in database
3. Hash is generated and stored on blockchain
4. Judge verifies and approves the report
5. Patient can securely download the report
6. System checks report integrity before download

---

## 🔒 Security Features

* Data integrity verification
* Role-based access control
* Blockchain hash validation
* Secure report downloads

---

## 📌 Future Enhancements

* Integration with hospital management systems
* Cloud deployment
* Mobile application support
* Advanced blockchain smart contracts

---

## 👨‍💻 Author

Developed as an academic project for secure medico-legal case management using blockchain technology.

---

## 📄 License

This project is for educational and research purposes.
