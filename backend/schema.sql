-- CuyoTech SSIS database (3NF). Running this file RESETS the database.
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS activity_log, clearances, payments, document_requests, grades, courses, students, programs, departments, users;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE users (
  id            VARCHAR(20)  PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  role          ENUM('Student','Registrar','Cashier','Department','Admin') NOT NULL,
  password_hash VARCHAR(100) NOT NULL,
  status        ENUM('Active','Deactivated') NOT NULL DEFAULT 'Active',
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE departments (
  dept_id INT AUTO_INCREMENT PRIMARY KEY,
  name    VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE programs (
  program_id INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(100) NOT NULL UNIQUE,
  dept_id    INT NOT NULL,
  FOREIGN KEY (dept_id) REFERENCES departments(dept_id)
);

CREATE TABLE students (
  student_id        VARCHAR(20) PRIMARY KEY,
  program_id        INT NOT NULL DEFAULT 1,
  section           VARCHAR(20) NOT NULL DEFAULT 'BSIT 3A',
  year_level        VARCHAR(20) NOT NULL DEFAULT 'Third year',
  enrollment_status ENUM('Pending','Enrolled') NOT NULL DEFAULT 'Pending',
  total_fees        DECIMAL(10,2) NOT NULL DEFAULT 20000.00,
  email             VARCHAR(100) NULL,
  mobile            VARCHAR(30)  NULL,
  address           VARCHAR(150) NULL,
  emergency_name    VARCHAR(100) NULL,
  emergency_rel     VARCHAR(40)  NULL,
  emergency_contact VARCHAR(30)  NULL,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (program_id) REFERENCES programs(program_id)
);

CREATE TABLE courses (
  code  VARCHAR(10) PRIMARY KEY,
  title VARCHAR(120) NOT NULL,
  units TINYINT NOT NULL
);

CREATE TABLE grades (
  student_id     VARCHAR(20) NOT NULL,
  course_code    VARCHAR(10) NOT NULL,
  midterm_grade  DECIMAL(3,2) NULL,
  final_grade    DECIMAL(3,2) NULL,
  PRIMARY KEY (student_id, course_code),
  FOREIGN KEY (student_id)  REFERENCES students(student_id) ON DELETE CASCADE,
  FOREIGN KEY (course_code) REFERENCES courses(code)
);

CREATE TABLE document_requests (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  request_no     VARCHAR(20) NOT NULL UNIQUE,
  student_id     VARCHAR(20) NOT NULL,
  doc_type       ENUM('Transcript of Records','Certificate of Registration','Certification') NOT NULL,
  purpose        VARCHAR(150) NOT NULL,
  copies         TINYINT NOT NULL DEFAULT 1,
  release_option ENUM('Office pickup','Authorized representative') NOT NULL DEFAULT 'Office pickup',
  notes          VARCHAR(255) NULL,
  status         ENUM('Submitted','Processing','Ready for release','Released') NOT NULL DEFAULT 'Submitted',
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE
);

CREATE TABLE payments (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  or_no       VARCHAR(20) NOT NULL UNIQUE,
  student_id  VARCHAR(20) NOT NULL,
  amount      DECIMAL(10,2) NOT NULL,
  method      ENUM('Cash','GCash','Bank transfer') NOT NULL,
  purpose     VARCHAR(60) NOT NULL DEFAULT 'Tuition',
  received_by VARCHAR(20) NULL,
  paid_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id)  REFERENCES students(student_id) ON DELETE CASCADE,
  FOREIGN KEY (received_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Registrar and Cashier clearance are derived (enrollment status / balance); the other offices are stored.
CREATE TABLE clearances (
  student_id VARCHAR(20) NOT NULL,
  office     ENUM('Library','Department','Student affairs') NOT NULL,
  status     ENUM('Cleared','Pending review','Action required') NOT NULL DEFAULT 'Pending review',
  remarks    VARCHAR(255) NULL,
  updated_by VARCHAR(20) NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (student_id, office),
  FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
  FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE activity_log (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    VARCHAR(20) NULL,
  action     VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);