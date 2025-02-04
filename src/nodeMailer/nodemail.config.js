import nodemailer from "nodemailer";

const transporter=nodemailer.createTransport({
    service:"gmail",
    secure:true,
    port:465,
    auth:{
        user:process.env.SENDER_EMAIL,
        pass:process.env.EMAIL_PASSWORD
    }
})

export default transporter