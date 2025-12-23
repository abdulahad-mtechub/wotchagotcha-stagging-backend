import nodemailer from "nodemailer";
export const emailSent = (email, output, subject) => {
  return new Promise((resolve, reject) => {
    var transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true, // use SSL
      service: "gmail",
      auth: {
        user: "testing.mtechub@gmail.com",
        pass: "xcvvjgixeuwgqmyl",
      },
    });
    var mailOptions = {
      from: "testing.mtechub@gmail.com",
      to: email,
      subject: subject,
      html: output,
    };
    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
        reject(error);
      } else {
        console.log("Email sent: " + info.response);
        resolve(true);
      }
    });
  });
};
