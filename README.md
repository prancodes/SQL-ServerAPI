# [SQL-ServerAPI](https://sqlserverapi.onrender.com/)

SQL-ServerAPI is a Node.js project that demonstrates basic CRUD operations using MySQL, Express, and EJS. The project is styled with Tailwind CSS and uses additional libraries like @faker-js/faker for generating dummy data and bcrypt for secure password hashing.

## View Demo : [SQL-ServerAPI](https://sqlserverapi.onrender.com/)

## Features

- **CRUD Operations:** Create, Read, Update, and Delete user records.
- **Admin Functions:** Only an admin can insert multiple random users or delete all users.
- **Secure Password Storage:** User passwords are hashed using bcrypt before being stored in the database.
- **Modern UI:** Server-side rendered pages using EJS and styled with Tailwind CSS.
- **Environment Configuration:** Utilizes dotenv for managing environment variables securely.

## Tech Stack

- **Backend:** Node.js, Express
- **Database:** MySQL
- **Templating:** EJS
- **Styling:** Tailwind CSS
- **Additional Libraries:**
  - [@faker-js/faker](https://github.com/faker-js/faker) – for dummy data generation
  - [bcrypt](https://github.com/kelektiv/node.bcrypt.js) – for password hashing
  - [method-override](https://github.com/expressjs/method-override) – to support HTTP verbs like PATCH and DELETE
  - [uuid](https://github.com/uuidjs/uuid) – for generating unique IDs

---

Thank you for checking out SQL-ServerAPI.  
Feel free to explore or use it as a reference for building CRUD applications with Node, Express, and MySQL.

Happy coding!
