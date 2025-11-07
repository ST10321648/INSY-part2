import { body } from "express-validator";

export const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d\S]{8,}$/;

export const amountRegex = /^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/;
export const currencyRegex = /^[A-Z]{3}$/;
export const recipientRegex = /^[A-Za-z ]{3,50}$/;

// Task 2 new fields
export const providerRegex = /^(SWIFT)$/; // extend later if needed
export const accountNumberRegex = /^[0-9]{8,20}$/;
export const swiftRegex = /^[A-Z0-9]{8}(?:[A-Z0-9]{3})?$/; // 8 or 11 chars

export const registerRules = [
  body("email").matches(emailRegex).withMessage("Invalid email"),
  body("password").matches(passwordRegex).withMessage("Password must be 8+ chars, include a letter and a number")
];

export const loginRules = [
  body("email").matches(emailRegex),
  body("password").isString().isLength({ min: 1 })
];

export const employeeLoginRules = [
  body("email").isEmail().withMessage("Invalid email"),
  body("password")
    .isLength({ min: 8 }).withMessage("Password must be at least 8 chars")
];

export const paymentRules = [
  body("amount").matches(amountRegex),
  body("currency").matches(currencyRegex),
  body("recipient").matches(recipientRegex),
  body("provider").matches(providerRegex),
  body("account_number").matches(accountNumberRegex),
  body("swift_code").matches(swiftRegex)
];
