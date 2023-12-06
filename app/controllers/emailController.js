const nodemailer = require("nodemailer");

module.exports = {
    async sendTransactionDataByEmail(email, htmlData) {
        // Konfigurasi transporter Nodemailer
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: "backendproject010101@gmail.com",
                pass: "fzkeehrkmvvsaaao",
            },
        });

        // Buat opsi email
        const mailOptions = {
            from: "ngaosberkahfamily.cvs@gmail.com",
            to: email,
            subject: "Data - CV Ngaos Berkah Family",
            html: htmlData,
        };

        // Kirim email
        await transporter.sendMail(mailOptions);
    },
};
