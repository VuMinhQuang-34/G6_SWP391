import { check } from "express-validator";

const signUpValidation = [
  check("firstName", "firstName is requied!").not().isEmpty(),
  check("lastName", "lastName is requied!").not().isEmpty(),
  check("email", "Email is required!")
    .isEmail()
    .normalizeEmail({ gmail_remove_dots: true }),
  check("password", "Password is required!")
    .not()
    .isEmpty()
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
];

const loginValidation = [
  check("email", "Email is required!"),
  check("password", "Password is required!")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
];
const validation = {
  signUpValidation,
  loginValidation,
};
export default validation;
