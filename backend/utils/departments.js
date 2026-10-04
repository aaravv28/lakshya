// The academic departments Lakshya serves. Students and jobs may only use these exact names.
const DEPARTMENTS = [
    "Computer Engineering",
    "Information Technology",
    "Electronics & Communication",
    "Electrical",
    "Mechanical",
    "Civil",
    "Chemical",
    "Instrumentation & Control"
];

const DEPARTMENT_MESSAGE = `Department must be one of: ${DEPARTMENTS.join(", ")}`;

module.exports = { DEPARTMENTS, DEPARTMENT_MESSAGE };
