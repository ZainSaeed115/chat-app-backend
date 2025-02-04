import transporter from "./nodemail.config.js";
import {
    VERIFICATION_EMAIL_TEMPLATE,
    WELCOME_EMAIL_TEMPLATE,
    PASSWORD_RESET_REQUEST_TEMPLATE,
    PASSWORD_RESET_SUCCESS_TEMPLATE
} from "./emailTemplates.js"
const sendVerificationEmail=async(email,verificationToken)=>{
  try {
      const response= await transporter.sendMail({
        from:process.env.SENDER_EMAIL,
        to:email,
        subject:"Verify Your Email",
        html:VERIFICATION_EMAIL_TEMPLATE.replace("{verificationCode}",verificationToken),
        
      })
      if(response)
      console.log(`Verification Email Sent Successfully:${response}`)
  } catch (error) {
    console.log(`Error in Sending Verification Email:${error}`)
  }
}

const sendWelcomeEmail=async(email,name)=>{
  try {
    const response= await transporter.sendMail({
        from:process.env.SENDER_EMAIL,
        to:email,
        subject:`Welcome to zChat.com!`,
        html:WELCOME_EMAIL_TEMPLATE.replace("{{username}}",name),
    });
    if(response)
        console.log(`Welcome Email Sent Successfully:${response}`)
  } catch (error) {
    console.log(`Welcome Email Error:${error}`)
  }
}

const sendResetPasswordRequestEmail=async(email,resetURL)=>{
   try {
      const response=transporter.sendMail({
        from:process.env.SENDER_EMAIL,
        to:email,
        subject:`Reset Your Password`,
        html:PASSWORD_RESET_REQUEST_TEMPLATE.replace("{resetURL}",resetURL),
      });
      if(response)
      console.log(`ResetEmail Sent Successfully:${response}`)
   } catch (error) {
    console.log("Error in reset password request:",error)
   }
}

const sendResetPasswordSuccessEmail=async(email)=>{
   try {
    
    const response=transporter.sendMail({
      from:process.env.SENDER_EMAIL,
      to:email,
      subject:`Password Reset Successful`,
      html:PASSWORD_RESET_SUCCESS_TEMPLATE,

    })
    if(response)
      console.log(`ResetEmail Sent Successfully:${response}`)
   } catch (error) {
    console.log(`Error in Sending Reset Password Success Email:${error}`)
   }
}
export {
    sendVerificationEmail,
    sendWelcomeEmail,
    sendResetPasswordRequestEmail,
    sendResetPasswordSuccessEmail
}
