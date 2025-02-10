import nodemailer from "nodemailer";

const { SMTP_MAIL, SMTP_PASSWORD } = process.env;

const sendMail = (to, subject, html) => {
  return new Promise((resolve, reject) => {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: SMTP_MAIL,
        pass: SMTP_PASSWORD,
      },
    });

    const mailOptions = {
      from: SMTP_MAIL,
      to,
      subject,
      html,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        reject(error); // Trả về lỗi để .catch() xử lý
      } else {
        resolve(info); // Trả về thông tin email đã gửi thành công để .then() xử lý
      }
    });
  });
};

export default sendMail;
