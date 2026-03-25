import nodemailer from "nodemailer";

const EMAIL_HOST = process.env.EMAIL_HOST || "smtp.gmail.com";
const EMAIL_PORT = process.env.EMAIL_PORT
  ? Number(process.env.EMAIL_PORT)
  : 465;
const EMAIL_SECURE = process.env.EMAIL_SECURE
  ? process.env.EMAIL_SECURE === "true"
  : true;
const EMAIL_USER = process.env.EMAIL_USER || "User6.mtechub@gmail.com";
const EMAIL_PASS = process.env.EMAIL_PASS || "jibnmztkypjwvxic";
const EMAIL_FROM = process.env.EMAIL_FROM || EMAIL_USER;

export const emailSent = (email, output, subject) => {
  return new Promise((resolve, reject) => {
    const transporter = nodemailer.createTransport({
      host: EMAIL_HOST,
      port: EMAIL_PORT,
      secure: EMAIL_SECURE,
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: EMAIL_FROM,
      to: email,
      subject: subject,
      html: output,
    };

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log("Email send error:", error);
        return reject(error);
      }
      console.log("Email sent: " + info.response);
      return resolve(true);
    });
  });
};
