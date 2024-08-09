# Awell Example Task Management System

## Purpose

This repository is a wrapper for Awell activities, designed to provide clinical stakeholders with a comprehensive task management system. The system allows users to complete activities and manage tasks efficiently, offering a structured approach to handling clinical workflows. The goal here is to help organizations who currently do not currently control their own tasking system by providing a simple one. Currently, it should not be expected to be maintained, but this decision may change at some point in the future.

The primary goal is to integrate Awell's activities into a broader task management framework, enabling better tracking, assignment, and completion of tasks associated with clinical operations. In general, the task will wrap some portion of a care flow (an activity, a step, a track, a care flow). This current implementation wraps activities, which is the smallest unit of work inside of Awell.

## What's in the Repo

This repository includes:

1. **Tasks**:

   - Core functionality for creating, managing, and tracking tasks related to clinical activities.
   - Supports full CRUD operations and integrates with users and patients for assignment and tracking.

2. **Patients**:

   - Manages patient data, allowing tasks to be associated with specific patients.
   - Supports full CRUD operations and handles patient-specific identifiers.

3. **Users**:

   - Manages user data, allowing for task assignment and role-based interactions.
   - Supports full CRUD operations and filtering based on user attributes like email domain.

4. **Webhook for Activity Service**:
   - Integrates with Awell's activity service to trigger and manage tasks based on clinical activities.
   - Allows for real-time updates and task creation based on activities performed within the Awell system.

## How to Run It

To get started with this project, follow these steps:

1. **Clone the Repository**:

   - Clone the repository to your local machine using:
     ```bash
     git clone https://github.com/your-repo/awell-task-management.git
     ```

2. **Update Environment Variables**:

   - Create a `.env` file in the root directory of the project and update it with the necessary environment variables:
     ```bash
     # .env
     DATABASE_URL=your_database_url
     PORT=3000
     ```

3. **Start the Application**:

   - Use Docker to start the application with the following command:
     ```bash
     docker-compose up
     ```

4. **Run Migrations**:

   - Once the containers are up, run the database migrations to set up the required tables:
     ```bash
     docker exec -it task_management_backend yarn migrate
     ```

5. **You're All Set!**:
   - The application should now be running on the specified port, and you can start interacting with the API.

## Contributions

Contributions are welcome! We are currently defining the contribution guidelines and will update this section soon.

---

This README provides a clear overview of the repository's purpose, what's included, how to run the application, and a placeholder for contribution guidelines. You can further customize it based on your project's specific needs and any additional instructions you want to include.
