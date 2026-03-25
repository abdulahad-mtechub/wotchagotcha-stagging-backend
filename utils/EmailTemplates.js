import moment from "moment";
import dotenv from "dotenv";
dotenv.config();
export const forgetPasswordTemplate = (otpCode) => {
  return `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Green Masterclass - OTP Verification</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 0;
            color: #fff;
        }

        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #fff;
            border-radius: 4px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        h2 {
            color: #FF6600;
            margin-bottom: 20px;
        }

        p {
            margin-bottom: 10px;
        }

        .otp-code {
            font-size: 24px;
            font-weight: bold;
            color:  #FF6600;
        }


        .footer {
            margin-top: 30px;
            text-align: center;
            color: #333;
        }
    </style>
</head>
<body>
<div class="container">
<center>  <h2>Watcha Gotcha - OTP Verification</h2></center>
    <center> <h3>Confirm Your Email Address</h3></center>
   
    <p>We have sent you a one-time password (OTP) for verification. Please use the OTP code below:</p>
    <center><p class="otp-code">${otpCode}</p></center>
    <p>If you did not request this OTP, please ignore this email.</p>
    <p class="footer">Thank you for choosing Watcha Gotcha!</p>
</div>
</body>
</html>

      `;
};
export const ConfirmEmailTemplate = (otpCode) => {
  return `<!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Watcha Gotcha - Account Verification</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                margin: 0;
                padding: 0;
                color: #333;
            }
    
            .container {
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #fff;
                border-radius: 4px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
    
            h2 {
                color: #007bff;
                margin-bottom: 20px;
            }
    
            p {
                margin-bottom: 10px;
            }
    
            .verification-code {
                font-size: 24px;
                font-weight: bold;
                color: #007bff;
            }
    
            .footer {
                margin-top: 30px;
                text-align: center;
            }
        </style>
    </head>
    <body>
    <div class="container">
        <h2>Watcha Gotcha - Account Verification</h2>
        <p>Hello,</p>
        <p>Thank you for choosing Watcha Gotcha!</p>
        <p>To verify your account and get started, please use the verification code below:</p>
        <p class="verification-code">${otpCode}</p>
        <p>If you did not request this verification code, please ignore this email.</p>
        <p class="footer">Thank you for choosing Watcha Gotcha!</p>
    </div>
    </body>
    </html>
    
  
        `;
};
export const WellcomeEmail = (username, date) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Document</title>
      </head>
    
      <body
        style="
          background-color: #00000012;
          margin: 0;
          padding: 0;
          font-family: 'Gill Sans', 'Gill Sans MT', Calibri, 'Trebuchet MS',
            sans-serif;
        "
      >
        <br />
        <center>
          <div
            style="
              max-width: 60%;
              margin-top: 4%;
              margin-bottom: 4%;
              background-color: white;
              text-align: justify;
            "
          >
            <div
              style="
                height: 65px;
                background-color: transparent;
                position: relative;
                margin-bottom: 40px;
              "
            >
              <br />
             <center>
  <img
    style="
      position: 'relative',
      margin-top: '8px',
      width: '81px',
      height: '73px',
    "
    src=${process.env.APP_LOGO_URL}
  />
</center>

            </div>
    
            <div style="padding: 0% 10%; margin-bottom: 40px"><center>
                <h2 style="padding-top: 1%;
                color: #000;
    font-size: 30px;
    font-style: normal;
    font-weight: 600;
    line-height: 140%; /* 28px */
    letter-spacing: 0.2px;
                font-family: 'Gill Sans', 'Gill Sans MT', Calibri, 'Trebuchet MS', sans-serif;">Welcome,${username}!</h2><br />
            </center>
            <!-- <center><img style="margin-bottom: 5%;" height="20%" width="20%"
                src="https://staging-healthhero-be.mtechub.com/admin_profile_images/1690277900112--icons8-checkmark-480.png" />
            </center> -->
            <p style="color: #000;
            font-size: 20px;
            font-style: normal;
            font-weight: 600;
            line-height: 140%;
            letter-spacing: 0.2px;">
               Thank you for choosing Captions
            </p><br />
            <p style="color: rgba(72, 72, 72, 0.80);
            font-size: 15px;
            font-style: normal;
            font-weight: 500;
            line-height: 176%; /* 15.84px */
            letter-spacing: 0.5px;">We are thrilled to have you as part of our community. Get ready to unleash the power of artificial intelligence to create captivating and insightful content effortlessly. Whether you're a content creator, a writer, a student, or a professional in any field, our platform is designed to make your content generation process seamless and efficient.</p><br />
            <br />
            <center><a style="margin-top: 1%;
                padding: 10px 40px;
                text-decoration: none !important;
                border-radius: 10px;
                border: 0px;
                background-color: #FF6600;
                color: white !important;
                font-weight: 600;
                cursor: pointer !important;" href=${process.env.APP_LINK} target="_blank">Get
                        Started</a></center></div>
    
            <center>
              <p style="color: black; margin-bottom: 20px">
                <b>Download Our App Now</b>
              </p>
            </center>
            <center>
              <div style="margin-top: 0%">
                <a
                href=${process.env.APP_GOOGLE_PLAY_STORE_LINK}
                  target="_blank"
                  ><img
                    style="cursor: pointer;margin-right: 5px;"
                    height="40px"
                    width="100px"
                    
                    src="https://s3-alpha-sig.figma.com/img/e175/2971/57064d979cf1551888120023c30f3ad2?Expires=1699833600&Signature=DEVBeHFjLoMNtavHFMKIZYpS3ZBgvYpxTvb32bNfGu3gPploUKF4MErViyjznTR2HWCZRFxp-ZZal1CdIPX8roUFQuh6PtH2CM60IsDol2KfXayiRMveJpL4hLmyBjjV6ecYRZ5Jk7XRBc93zODHIcHjcVwSqIG5oWGN3k0MV0oiCXrjyT--O5AJEtKG6LBro-9Tr7VWzivcAS2Exr0FZ2pIaarOATmMhYAJOzp4hV872dXIp8Mx-KPBg6cQY1FHgdU1Xsh1sOEaJ4EWxjCkxrkE9dybV-QG4RowaEImWwKlHLCLtrxVgcxHR~LgVvG-G8i5Qyu~PbB2t-V3EXo-zw__&Key-Pair-Id=APKAQ4GOSFWCVNEHN3O4"
                /></a>
                <a
                href=${process.env.APP_STORE_LINK}
                  target="_blank"
                  ><img
                    style="cursor: pointer"
                    height="40px"
                    width="100px"
                    src="https://s3-alpha-sig.figma.com/img/62b2/ddc3/c5307de615a3f1f0280fd8cae5fad35e?Expires=1699833600&Signature=A0QmuDR0yyuy0CadmWZ7pfoQOJ3svyQ4Blawn-httRE3IubPcFEnlDTRpwjQ3kXM7HcT92EjG-M7ARPbW8kbxBL3VS3kMh1U8~M9H0s4d3O9uKOIU5Hva8Rbcr68JJlCP4TLo4VL5y8KpocUf7ttWMOeVvl5VJze4KavSlJUe~oss6AJudto-qYFy0OoAtvQprfAsk6tgCGuH16MpQcVm~KCs8irxvN9UU6P7YxLQeBew35bpyvxaDxpSuIVSjZOjaRx8vbDVc876S0~pg8yHNkhvLnUcHVQBmTjOwGQAKOKhqHW~Bsfle2FFKSn4sBhMR3oHWp8p-QYxen~b99PvQ__&Key-Pair-Id=APKAQ4GOSFWCVNEHN3O4"
                /></a>
              </div>
            </center>
            <!-- <div style="margin-top: 2%">
              <center>
                <p
                  style="
                    font-size: 10px;
                    color: rgb(122, 122, 122) !important;
                    text-decoration: none;
                    margin-bottom: 20px;
                  "
                >
                  <a
                    style="
                      font-size: 10px;
                      color: rgb(122, 122, 122) !important;
                      text-decoration: none;
                      margin-bottom: 20px;
                    "
                    href="mailto:info@healthhero.club"
                    >info@healthhero.club</a
                  >
                  |
                  <a
                    style="
                      font-size: 10px;
                      color: rgb(122, 122, 122) !important;
                      text-decoration: none;
                      margin-bottom: 20px;
                    "
                    href="mailto:info@healthhero.club"
                    >healthhero.info@gmail.com</a
                  >
                </p>
              </center>
              <center>
                <div style="margin-top: 1%">
                  <a href="https://www.facebook.com/" target="_blank"
                    ><img
                      style="cursor: pointer !important; margin: 0 5px"
                      height="20px"
                      width="20px"
                      src="https://staging-healthhero-be.mtechub.com/admin_profile_images/1690281104841--icons8-facebook-480.png"
                  /></a>
                  <a href="https://www.instagram.com/" target="_blank">
                    <img
                      style="cursor: pointer !important; margin: 0 5px"
                      height="20px"
                      width="20px"
                      src="https://staging-healthhero-be.mtechub.com/admin_profile_images/1690281208209--icons8-instagram-480.png"
                  /></a>
                  <a href="https://www.linkedin.com/" target="_blank"
                    ><img
                      style="cursor: pointer !important; margin: 0 5px"
                      height="20px"
                      width="20px"
                      src="https://staging-healthhero-be.mtechub.com/admin_profile_images/1690281050481--icons8-linkedin-500.png"
                  /></a>
                </div>
              </center>
            </div> -->
            <br />
            <center>
              <div>
                <p
                  style="
                  color: #4C4C4C;
    font-size: 12px;
    font-style: normal;
    font-weight: 500;
    line-height: 176%; /* 14.08px */
    letter-spacing: 0.5px;
                  "
                >
                Copyright © 2023 Captions. All Rights Reserved
                </p>
              </div>
              <br />
            </center>
          </div>
        </center>
        <br />
      </body>
    </html>
    
    
    
    `;
};
export const SubscriptionEmail = (username, date) => {
  return `
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Document</title>
    </head>
  
    <body
      style="
        background-color: #00000012;
        margin: 0;
        padding: 0;
        font-family: 'Gill Sans', 'Gill Sans MT', Calibri, 'Trebuchet MS',
          sans-serif;
      "
    >
      <br />
      <center>
        <div
          style="
            max-width: 60%;
            margin-top: 4%;
            margin-bottom: 4%;
            background-color: white;
            text-align: justify;
          "
        >
          <div
            style="
              height: 65px;
              background-color: transparent;
              position: relative;
              margin-bottom: 40px;
            "
          >
            <br />
            <center>
              <img
                style="
                  position: relative;
                  margin-top: 8px;
                  width: 81px;
                  height: 73px;
                "
                src=${process.env.APP_LOGO_URL}
              />
            </center>
          </div>
  
          <div style="padding: 0% 10%; margin-bottom: 40px">
            <center>
              <h2
                style="
                  padding-top: 1%;
                  color: #000;
                  font-size: 30px;
                  font-style: normal;
                  font-weight: 600;
                  line-height: 140%; /* 28px */
                  letter-spacing: 0.2px;
                  font-family: 'Gill Sans', 'Gill Sans MT', Calibri,
                    'Trebuchet MS', sans-serif;
                "
              >
              Welcome to the Watcha-gotcha Premium Experience!,${username}!
              </h2>
              <br />
            </center>
            <!-- <center><img style="margin-bottom: 5%;" height="20%" width="20%"
              src="https://staging-healthhero-be.mtechub.com/admin_profile_images/1690277900112--icons8-checkmark-480.png" />
          </center> -->
            <p
              style="
                color: rgba(72, 72, 72, 0.8);
                font-size: 17px;
                font-style: normal;
                font-weight: 500;
                line-height: 140%;
                letter-spacing: 0.2px;
              "
            >
              We are thrilled to share in your excitement as you've just taken an
              important step in enhancing your experience with our app.
              Congratulations on your successful subscription purchase! 🎉
            </p>
            <br />
            <p
              style="
                color: rgba(72, 72, 72, 0.8);
                font-size: 15px;
                font-style: normal;
                font-weight: 500;
                line-height: 176%; /* 15.84px */
                letter-spacing: 0.5px;
              "
            >
              Your decision to subscribe to Watcha Gotcha opens up a world of
              possibilities and premium features that will undoubtedly elevate
              your experience.
            </p>
            <br />
            <br />
            <!-- <center>
              <a
                style="
                  margin-top: 1%;
                  padding: 10px 40px;
                  text-decoration: none !important;
                  border-radius: 10px;
                  border: 0px;
                  background-color: #ff6600;
                  color: white !important;
                  font-weight: 600;
                  cursor: pointer !important;
                "
                href="${process.env.APP_LINK}"
                target="_blank"
                >Get Started</a
              >
            </center> -->
          </div>
  
          <center>
            <p style="color: black; margin-bottom: 20px">
              <b>Download Our App Now</b>
            </p>
          </center>
          <center>
            <div style="margin-top: 0%">
              <a
                href=${process.env.APP_GOOGLE_PLAY_STORE_LINK}
                target="_blank"
                ><img
                  style="cursor: pointer; margin-right: 5px"
                  height="40px"
                  width="100px"
                  src="https://s3-alpha-sig.figma.com/img/e175/2971/57064d979cf1551888120023c30f3ad2?Expires=1699833600&Signature=DEVBeHFjLoMNtavHFMKIZYpS3ZBgvYpxTvb32bNfGu3gPploUKF4MErViyjznTR2HWCZRFxp-ZZal1CdIPX8roUFQuh6PtH2CM60IsDol2KfXayiRMveJpL4hLmyBjjV6ecYRZ5Jk7XRBc93zODHIcHjcVwSqIG5oWGN3k0MV0oiCXrjyT--O5AJEtKG6LBro-9Tr7VWzivcAS2Exr0FZ2pIaarOATmMhYAJOzp4hV872dXIp8Mx-KPBg6cQY1FHgdU1Xsh1sOEaJ4EWxjCkxrkE9dybV-QG4RowaEImWwKlHLCLtrxVgcxHR~LgVvG-G8i5Qyu~PbB2t-V3EXo-zw__&Key-Pair-Id=APKAQ4GOSFWCVNEHN3O4"
              /></a>
              <a
              href=${process.env.APP_STORE_LINK}
                target="_blank"
                ><img
                  style="cursor: pointer"
                  height="40px"
                  width="100px"
                  src="https://s3-alpha-sig.figma.com/img/62b2/ddc3/c5307de615a3f1f0280fd8cae5fad35e?Expires=1699833600&Signature=A0QmuDR0yyuy0CadmWZ7pfoQOJ3svyQ4Blawn-httRE3IubPcFEnlDTRpwjQ3kXM7HcT92EjG-M7ARPbW8kbxBL3VS3kMh1U8~M9H0s4d3O9uKOIU5Hva8Rbcr68JJlCP4TLo4VL5y8KpocUf7ttWMOeVvl5VJze4KavSlJUe~oss6AJudto-qYFy0OoAtvQprfAsk6tgCGuH16MpQcVm~KCs8irxvN9UU6P7YxLQeBew35bpyvxaDxpSuIVSjZOjaRx8vbDVc876S0~pg8yHNkhvLnUcHVQBmTjOwGQAKOKhqHW~Bsfle2FFKSn4sBhMR3oHWp8p-QYxen~b99PvQ__&Key-Pair-Id=APKAQ4GOSFWCVNEHN3O4"
              /></a>
            </div>
          </center>
          <!-- <div style="margin-top: 2%">
            <center>
              <p
                style="
                  font-size: 10px;
                  color: rgb(122, 122, 122) !important;
                  text-decoration: none;
                  margin-bottom: 20px;
                "
              >
                <a
                  style="
                    font-size: 10px;
                    color: rgb(122, 122, 122) !important;
                    text-decoration: none;
                    margin-bottom: 20px;
                  "
                  href="mailto:info@healthhero.club"
                  >info@healthhero.club</a
                >
                |
                <a
                  style="
                    font-size: 10px;
                    color: rgb(122, 122, 122) !important;
                    text-decoration: none;
                    margin-bottom: 20px;
                  "
                  href="mailto:info@healthhero.club"
                  >healthhero.info@gmail.com</a
                >
              </p>
            </center>
            <center>
              <div style="margin-top: 1%">
                <a href="https://www.facebook.com/" target="_blank"
                  ><img
                    style="cursor: pointer !important; margin: 0 5px"
                    height="20px"
                    width="20px"
                    src="https://staging-healthhero-be.mtechub.com/admin_profile_images/1690281104841--icons8-facebook-480.png"
                /></a>
                <a href="https://www.instagram.com/" target="_blank">
                  <img
                    style="cursor: pointer !important; margin: 0 5px"
                    height="20px"
                    width="20px"
                    src="https://staging-healthhero-be.mtechub.com/admin_profile_images/1690281208209--icons8-instagram-480.png"
                /></a>
                <a href="https://www.linkedin.com/" target="_blank"
                  ><img
                    style="cursor: pointer !important; margin: 0 5px"
                    height="20px"
                    width="20px"
                    src="https://staging-healthhero-be.mtechub.com/admin_profile_images/1690281050481--icons8-linkedin-500.png"
                /></a>
              </div>
            </center>
          </div> -->
          <br />
          <center>
            <div>
              <p
                style="
                  color: #4c4c4c;
                  font-size: 12px;
                  font-style: normal;
                  font-weight: 500;
                  line-height: 176%; /* 14.08px */
                  letter-spacing: 0.5px;
                "
              >
                Copyright © 2023 Captions. All Rights Reserved
              </p>
            </div>
            <br />
          </center>
        </div>
      </center>
      <br />
    </body>
  </html>
    `;
};
export const CancellationEmail = (username, date) => {
  return `
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Document</title>
    </head>
  
    <body
      style="
        background-color: #00000012;
        margin: 0;
        padding: 0;
        font-family: 'Gill Sans', 'Gill Sans MT', Calibri, 'Trebuchet MS',
          sans-serif;
      "
    >
      <br />
      <center>
        <div
          style="
            max-width: 60%;
            margin-top: 4%;
            margin-bottom: 4%;
            background-color: white;
            text-align: justify;
          "
        >
          <div
            style="
              height: 65px;
              background-color: transparent;
              position: relative;
              margin-bottom: 40px;
            "
          >
            <br />
            <center>
              <img
                style="
                  position: relative;
                  margin-top: 8px;
                  width: 81px;
                  height: 73px;
                "
                src=${process.env.APP_LOGO_URL}
              />
            </center>
          </div>
  
          <div style="padding: 0% 10%; margin-bottom: 40px">
            <center>
              <h2
                style="
                  padding-top: 1%;
                  color: #000;
                  font-size: 30px;
                  font-style: normal;
                  font-weight: 600;
                  line-height: 140%; /* 28px */
                  letter-spacing: 0.2px;
                  font-family: 'Gill Sans', 'Gill Sans MT', Calibri,
                    'Trebuchet MS', sans-serif;
                "
              >
              Subscription Cancellation Confirmation, ${username}!
              </h2>
              <br />
            </center>
            <p
              style="
                color: rgba(72, 72, 72, 0.8);
                font-size: 17px;
                font-style: normal;
                font-weight: 500;
                line-height: 140%;
                letter-spacing: 0.2px;
              "
            >
              We're sorry to hear that you've canceled your subscription. 
              If you have any feedback or concerns, please let us know. We value your input.
            </p>
            <br />
            <p
              style="
                color: rgba(72, 72, 72, 0.8);
                font-size: 15px;
                font-style: normal;
                font-weight: 500;
                line-height: 176%;
                letter-spacing: 0.5px;
              "
            >
              We hope you'll consider reactivating your subscription in the future to continue enjoying our premium features.
            </p>
          </div>
  
          <center>
            <p style="color: black; margin-bottom: 20px">
              <b>Download Our App</b>
            </p>
          </center>
          <center>
            <div style="margin-top: 0%">
              <a
                href=${process.env.APP_GOOGLE_PLAY_STORE_LINK}
                target="_blank"
                ><img
                  style="cursor: pointer; margin-right: 5px"
                  height="40px"
                  width="100px"
                  src="https://s3-alpha-sig.figma.com/img/e175/2971/57064d979cf1551888120023c30f3ad2?Expires=1699833600&Signature=DEVBeHFjLoMNtavHFMKIZYpS3ZBgvYpxTvb32bNfGu3gPploUKF4MErViyjznTR2HWCZRFxp-ZZal1CdIPX8roUFQuh6PtH2CM60IsDol2KfXayiRMveJpL4hLmyBjjV6ecYRZ5Jk7XRBc93zODHIcHjcVwSqIG5oWGN3k0MV0oiCXrjyT--O5AJEtKG6LBro-9Tr7VWzivcAS2Exr0FZ2pIaarOATmMhYAJOzp4hV872dXIp8Mx-KPBg6cQY1FHgdU1Xsh1sOEaJ4EWxjCkxrkE9dybV-QG4RowaEImWwKlHLCLtrxVgcxHR~LgVvG-G8i5Qyu~PbB2t-V3EXo-zw__&Key-Pair-Id=APKAQ4GOSFWCVNEHN3O4"
              /></a>
              <a
                href=${process.env.APP_STORE_LINK}
                target="_blank"
                ><img
                  style="cursor: pointer"
                  height="40px"
                  width="100px"
                  src="https://s3-alpha-sig.figma.com/img/62b2/ddc3/c5307de615a3f1f0280fd8cae5fad35e?Expires=1699833600&Signature=A0QmuDR0yyuy0CadmWZ7pfoQOJ3svyQ4Blawn-httRE3IubPcFEnlDTRpwjQ3kXM7HcT92EjG-M7ARPbW8kbxBL3VS3kMh1U8~M9H0s4d3O9uKOIU5Hva8Rbcr68JJlCP4TLo4VL5y8KpocUf7ttWMOeVvl5VJze4KavSlJUe~oss6AJudto-qYFy0OoAtvQprfAsk6tgCGuH16MpQcVm~KCs8irxvN9UU6P7YxLQeBew35bpyvxaDxpSuIVSjZOjaRx8vbDVc876S0~pg8yHNkhvLnUcHVQBmTjOwGQAKOKhqHW~Bsfle2FFKSn4sBhMR3oHWp8p-QYxen~b99PvQ__&Key-Pair-Id=APKAQ4GOSFWCVNEHN3O4"
              /></a>
            </div>
          </center>
          <br />
          <center>
            <div>
              <p
                style="
                  color: #4c4c4c;
                  font-size: 12px;
                  font-style: normal;
                  font-weight: 500;
                  line-height: 176%;
                  letter-spacing: 0.5px;
                "
              >
                Copyright © 2023 Captions. All Rights Reserved
              </p>
            </div>
            <br />
          </center>
        </div>
      </center>
      <br />
    </body>
  </html>
    `;
};

// export const WellcomeEmail = (username, date) => {
//   return `
//   <!DOCTYPE html>
//   <html>
//     <head>
//       <meta charset="utf-8" />
//       <title>Welcome to Jadwali</title>
//       <link
//         rel="stylesheet"
//         href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css"
//         integrity="sha512-z3gLpd7yknf1YoNbCzqRKc4qyor8gaKU1qmn+CShxbuBusANI9QpRohGBreCFkKxLhei6S9CQXFEbbKuqLg0DA=="
//         crossorigin="anonymous"
//         referrerpolicy="no-referrer"
//       />
//       <style>
//         body {
//           font-family: Arial, sans-serif;
//           margin: 0;
//           padding: 0;
//           background-color: #f2f2f2;
//         }
//         .navbar {
//           background-color: #ff6600;
//           display: flex;
//           justify-content: space-between;
//           align-items: center;
//           padding: 10px 20px;
//           box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
//         }
//         .navbar-left {
//           display: flex;
//           align-items: center;
//           justify-content: center;
//         }
//         .navbar-left svg {
//           /* max-width: 40px; */
//           margin-right: 10px;
//         }

//         .navbar-left span {
//           color: #fff;
//           font-family: Inter;
//           font-size: 20px;
//           font-style: normal;
//           font-weight: 600;
//           line-height: 140%; /* 28px */
//           letter-spacing: 0.7px;
//         }
//         .navbar-right {
//           color: #fff;
//           font-family: Inter;
//           font-size: 20px;
//           font-style: normal;
//           font-weight: 500;
//           line-height: 140%; /* 18.2px */
//           letter-spacing: 0.2px;
//         }

//         .container {
//           position: relative;
//           /* width: 100%;
//           margin: 0 auto; */
//           /* display: flex;
//           align-items: center;
//           justify-content: center; */
//           height: 88vh;
//           background: linear-gradient(to bottom, #ff6600 50%, #ffffff 50%);
//         }
//         .main {
//           position: absolute;
//           /* top: 0;
//     left: 0; */

//           width: 60%;
//           height: 80%;
//           color: white; /* Text color for main content */
//         }
//         .main-top {
//           background-color: white;
//           position: relative;
//           padding: 40px 20px 40px 20px;
//           width: 65%;
//           text-align: center;
//           border-radius: 13px;
//           box-shadow: 0px 4px 7px 0px rgba(0, 0, 0, 0.07);
//         }
//         .main-overlay {
//           background-image: url("YOUR_WAVE_IMAGE_URL_HERE");
//           background-repeat: no-repeat;
//           background-size: cover;
//           position: absolute;
//           top: 0;
//           left: 0;
//           width: 100%;
//           height: 100%;
//           z-index: -1;
//         }
//         .main-bottom {
//           text-align: center;
//           color: #4c4c4c;
//           font-family: Inter;
//           font-size: 14px;
//           font-style: normal;
//           font-weight: 500;
//           line-height: 176%; /* 14.08px */
//           letter-spacing: 0.5px;
//         }
//         img {
//           max-width: 15%;
//           margin-top: 20px;
//         }
//         h2 {
//           color: #000;
//           font-size: 2em;
//         }
//         p {
//           color: #555;
//         }
//         .main_heading {
//           color: #000;
//           font-family: Inter;
//           font-size: 30px;
//           font-style: normal;
//           font-weight: 600;
//           line-height: 140%; /* 28px */
//           letter-spacing: 0.2px;
//         }
//         .heading {
//           color: #000;
//           font-family: Montserrat;
//           font-size: 20px;
//           font-style: normal;
//           font-weight: 600;
//           line-height: 140%; /* 16.8px */
//           letter-spacing: 0.2px;
//         }
//         .para {
//           color: rgba(72, 72, 72, 0.8);
//           font-family: Montserrat;
//           font-size: 15px;
//           font-style: normal;
//           font-weight: 500;
//           line-height: 176%; /* 15.84px */
//           letter-spacing: 0.5px;
//         }
//         .button {
//           display: inline-block;
//           padding: 8px 40px;
//           background-color: #ff6600;
//           box-shadow: 0px 4px 12px 0px rgba(0, 0, 0, 0.12);
//           color: #fff;
//           border: none;
//           border-radius: 15px;
//           margin: 10px;
//           text-decoration: none;
//         }
//       </style>
//     </head>
//     <body>
//       <div class="navbar">
//         <div class="navbar-left">
//           <svg
//             xmlns="http://www.w3.org/2000/svg"
//             width="54"
//             height="52"
//             viewBox="0 0 54 52"
//             fill="none"
//           >
//             <rect
//               x="3.2644"
//               y="17.8667"
//               width="23.1967"
//               height="13.6635"
//               rx="6.83176"
//               transform="rotate(-42.7535 3.2644 17.8667)"
//               stroke="white"
//               stroke-width="3"
//             />
//             <rect
//               x="2.11969"
//               y="-0.0831526"
//               width="23.1967"
//               height="13.6635"
//               rx="6.83176"
//               transform="matrix(0.734281 0.678846 0.678846 -0.734281 0.61969 32.6333)"
//               stroke="white"
//               stroke-width="3"
//             />
//             <rect
//               x="-2.11969"
//               y="0.0831526"
//               width="23.1967"
//               height="13.6635"
//               rx="6.83176"
//               transform="matrix(-0.734281 -0.678846 -0.678846 0.734281 49.7338 16.3667)"
//               stroke="white"
//               stroke-width="3"
//             />
//             <rect
//               x="51.3443"
//               y="34.1333"
//               width="23.1967"
//               height="13.6635"
//               rx="6.83176"
//               transform="rotate(137.246 51.3443 34.1333)"
//               stroke="white"
//               stroke-width="3"
//             />
//           </svg>
//           <span>watcha-gotcha</span>
//         </div>
//         <div class="navbar-right">
//           <span>Date: ${moment(date).format('DD MMMM YYYY')}</span>
//         </div>
//       </div>

//       <div class="container">

//               <div class="main">
//                   <center style="width: 60vw;">
//                   <div class="main-top">
//                     <h2 class="main_heading">Welcome ${username}</h2>
//                     <p class="heading">Thank you for choosing Captions</p>
//                     <p class="para">
//                       We are thrilled to have you as part of our community. Get ready to
//                       unleash the power of artificial intelligence to create captivating
//                       and insightful content effortlessly. Whether you're a content
//                       creator, a writer, a student, or a professional in any field, our
//                       platform is designed to make your content generation process
//                       seamless and efficient.
//                     </p>
//                     <a class="button" href="https://www.facebook.com/">Get Started</a>

//                     <div>
//                       <img
//                         src="https://s3-alpha-sig.figma.com/img/e175/2971/57064d979cf1551888120023c30f3ad2?Expires=1699833600&Signature=DEVBeHFjLoMNtavHFMKIZYpS3ZBgvYpxTvb32bNfGu3gPploUKF4MErViyjznTR2HWCZRFxp-ZZal1CdIPX8roUFQuh6PtH2CM60IsDol2KfXayiRMveJpL4hLmyBjjV6ecYRZ5Jk7XRBc93zODHIcHjcVwSqIG5oWGN3k0MV0oiCXrjyT--O5AJEtKG6LBro-9Tr7VWzivcAS2Exr0FZ2pIaarOATmMhYAJOzp4hV872dXIp8Mx-KPBg6cQY1FHgdU1Xsh1sOEaJ4EWxjCkxrkE9dybV-QG4RowaEImWwKlHLCLtrxVgcxHR~LgVvG-G8i5Qyu~PbB2t-V3EXo-zw__&Key-Pair-Id=APKAQ4GOSFWCVNEHN3O4"
//                         alt="logo"
//                         style="margin-right: 10px"
//                       />
//                       <img
//                         src="https://s3-alpha-sig.figma.com/img/62b2/ddc3/c5307de615a3f1f0280fd8cae5fad35e?Expires=1699833600&Signature=A0QmuDR0yyuy0CadmWZ7pfoQOJ3svyQ4Blawn-httRE3IubPcFEnlDTRpwjQ3kXM7HcT92EjG-M7ARPbW8kbxBL3VS3kMh1U8~M9H0s4d3O9uKOIU5Hva8Rbcr68JJlCP4TLo4VL5y8KpocUf7ttWMOeVvl5VJze4KavSlJUe~oss6AJudto-qYFy0OoAtvQprfAsk6tgCGuH16MpQcVm~KCs8irxvN9UU6P7YxLQeBew35bpyvxaDxpSuIVSjZOjaRx8vbDVc876S0~pg8yHNkhvLnUcHVQBmTjOwGQAKOKhqHW~Bsfle2FFKSn4sBhMR3oHWp8p-QYxen~b99PvQ__&Key-Pair-Id=APKAQ4GOSFWCVNEHN3O4"
//                         alt="logo"
//                       />
//                     </div>
//                     <div class="main-overlay"></div>
//                   </div>
//               </center>
//                   <div class="main-bottom">
//                     <p>Copyright © 2023 Captions. All Rights Reserved</p>
//                   </div>
//                 </div>

//       </div>

//     </body>
//   </html>

//     `;
// };
// export const WellcomeEmail=(username,date)=>{
// return `
// <!DOCTYPE html>
// <html>
//   <head>
//     <meta charset="utf-8" />
//     <title>Welcome to Jadwali</title>
//     <link
//       rel="stylesheet"
//       href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css"
//       integrity="sha512-z3gLpd7yknf1YoNbCzqRKc4qyor8gaKU1qmn+CShxbuBusANI9QpRohGBreCFkKxLhei6S9CQXFEbbKuqLg0DA=="
//       crossorigin="anonymous"
//       referrerpolicy="no-referrer"
//     />
//     <style>
//       body {
//         font-family: Arial, sans-serif;
//         margin: 0;
//         padding: 0;
//         background-color: #f2f2f2;
//       }
//       .navbar {
//         background-color: #ff6600;
//         display: flex;
//         justify-content: space-between;
//         align-items: center;
//         padding: 10px 20px;
//         box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
//       }
//       .navbar-left {
//         display: flex;
//         align-items: center;
//         justify-content: center;
//       }
//       .navbar-left svg {
//         /* max-width: 40px; */
//         margin-right: 10px;
//       }

//       .navbar-left span {
//         color: #fff;
//         font-family: Inter;
//         font-size: 20px;
//         font-style: normal;
//         font-weight: 600;
//         line-height: 140%; /* 28px */
//         letter-spacing: 0.7px;
//       }
//       .navbar-right {
//         color: #fff;
//         font-family: Inter;
//         font-size: 20px;
//         font-style: normal;
//         font-weight: 500;
//         line-height: 140%; /* 18.2px */
//         letter-spacing: 0.2px;
//       }

//       .container {
//         position: relative;
//         /* width: 100%;
//         margin: 0 auto; */
//         display: flex;
//         align-items: center;
//         justify-content: center;
//         height: 88vh;
//         background: linear-gradient(to bottom, #ff6600 50%, #ffffff 50%);
//       }
//       .main {
//         position: absolute;
//         /* top: 0;
//   left: 0; */

//         width: 60%;
//         height: 80%;
//         color: white; /* Text color for main content */
//       }
//       .main-top {
//         background-color: white;
//         position: relative;
//         padding: 40px 20px 40px 20px;
//         text-align: center;
//         border-radius: 13px;
//         box-shadow: 0px 4px 7px 0px rgba(0, 0, 0, 0.07);
//       }
//       .main-overlay {
//         background-image: url("YOUR_WAVE_IMAGE_URL_HERE");
//         background-repeat: no-repeat;
//         background-size: cover;
//         position: absolute;
//         top: 0;
//         left: 0;
//         width: 100%;
//         height: 100%;
//         z-index: -1;
//       }
//       .main-bottom {
//         text-align: center;
//         color: #4c4c4c;
//         font-family: Inter;
//         font-size: 14px;
//         font-style: normal;
//         font-weight: 500;
//         line-height: 176%; /* 14.08px */
//         letter-spacing: 0.5px;
//       }
//       img {
//         max-width: 15%;
//         margin-top: 20px;
//       }
//       h2 {
//         color: #000;
//         font-size: 2em;
//       }
//       p {
//         color: #555;
//       }
//       .main_heading {
//         color: #000;
//         font-family: Inter;
//         font-size: 30px;
//         font-style: normal;
//         font-weight: 600;
//         line-height: 140%; /* 28px */
//         letter-spacing: 0.2px;
//       }
//       .heading {
//         color: #000;
//         font-family: Montserrat;
//         font-size: 20px;
//         font-style: normal;
//         font-weight: 600;
//         line-height: 140%; /* 16.8px */
//         letter-spacing: 0.2px;
//       }
//       .para {
//         color: rgba(72, 72, 72, 0.8);
//         font-family: Montserrat;
//         font-size: 15px;
//         font-style: normal;
//         font-weight: 500;
//         line-height: 176%; /* 15.84px */
//         letter-spacing: 0.5px;
//       }
//       .button {
//         display: inline-block;
//         padding: 8px 40px;
//         background-color: #ff6600;
//         box-shadow: 0px 4px 12px 0px rgba(0, 0, 0, 0.12);
//         color: #fff;
//         border: none;
//         border-radius: 15px;
//         margin: 10px;
//         text-decoration: none;
//       }
//     </style>
//   </head>
//   <body>
//     <div class="navbar">
//       <div class="navbar-left">
//         <svg
//           xmlns="http://www.w3.org/2000/svg"
//           width="54"
//           height="52"
//           viewBox="0 0 54 52"
//           fill="none"
//         >
//           <rect
//             x="3.2644"
//             y="17.8667"
//             width="23.1967"
//             height="13.6635"
//             rx="6.83176"
//             transform="rotate(-42.7535 3.2644 17.8667)"
//             stroke="white"
//             stroke-width="3"
//           />
//           <rect
//             x="2.11969"
//             y="-0.0831526"
//             width="23.1967"
//             height="13.6635"
//             rx="6.83176"
//             transform="matrix(0.734281 0.678846 0.678846 -0.734281 0.61969 32.6333)"
//             stroke="white"
//             stroke-width="3"
//           />
//           <rect
//             x="-2.11969"
//             y="0.0831526"
//             width="23.1967"
//             height="13.6635"
//             rx="6.83176"
//             transform="matrix(-0.734281 -0.678846 -0.678846 0.734281 49.7338 16.3667)"
//             stroke="white"
//             stroke-width="3"
//           />
//           <rect
//             x="51.3443"
//             y="34.1333"
//             width="23.1967"
//             height="13.6635"
//             rx="6.83176"
//             transform="rotate(137.246 51.3443 34.1333)"
//             stroke="white"
//             stroke-width="3"
//           />
//         </svg>
//         <span>watcha-gotcha</span>
//       </div>
//       <div class="navbar-right">
//         <span>Date: ${moment(date).format('DD MMMM YYYY')}</span>
//       </div>
//     </div>
//     <div class="container">
//       <div class="main">
//         <div class="main-top">
//           <h2 class="main_heading">Welcome ${username}</h2>
//           <p class="heading">Thank you for choosing Captions</p>
//           <p class="para">
//             We are thrilled to have you as part of our community. Get ready to
//             unleash the power of artificial intelligence to create captivating
//             and insightful content effortlessly. Whether you're a content
//             creator, a writer, a student, or a professional in any field, our
//             platform is designed to make your content generation process
//             seamless and efficient.
//           </p>
//           <a class="button" href="https://www.facebook.com/">Get Started</a>

//           <div>
//             <img
//               src="https://s3-alpha-sig.figma.com/img/e175/2971/57064d979cf1551888120023c30f3ad2?Expires=1699833600&Signature=DEVBeHFjLoMNtavHFMKIZYpS3ZBgvYpxTvb32bNfGu3gPploUKF4MErViyjznTR2HWCZRFxp-ZZal1CdIPX8roUFQuh6PtH2CM60IsDol2KfXayiRMveJpL4hLmyBjjV6ecYRZ5Jk7XRBc93zODHIcHjcVwSqIG5oWGN3k0MV0oiCXrjyT--O5AJEtKG6LBro-9Tr7VWzivcAS2Exr0FZ2pIaarOATmMhYAJOzp4hV872dXIp8Mx-KPBg6cQY1FHgdU1Xsh1sOEaJ4EWxjCkxrkE9dybV-QG4RowaEImWwKlHLCLtrxVgcxHR~LgVvG-G8i5Qyu~PbB2t-V3EXo-zw__&Key-Pair-Id=APKAQ4GOSFWCVNEHN3O4"
//               alt="logo"
//               style="margin-right: 10px"
//             />
//             <img
//               src="https://s3-alpha-sig.figma.com/img/62b2/ddc3/c5307de615a3f1f0280fd8cae5fad35e?Expires=1699833600&Signature=A0QmuDR0yyuy0CadmWZ7pfoQOJ3svyQ4Blawn-httRE3IubPcFEnlDTRpwjQ3kXM7HcT92EjG-M7ARPbW8kbxBL3VS3kMh1U8~M9H0s4d3O9uKOIU5Hva8Rbcr68JJlCP4TLo4VL5y8KpocUf7ttWMOeVvl5VJze4KavSlJUe~oss6AJudto-qYFy0OoAtvQprfAsk6tgCGuH16MpQcVm~KCs8irxvN9UU6P7YxLQeBew35bpyvxaDxpSuIVSjZOjaRx8vbDVc876S0~pg8yHNkhvLnUcHVQBmTjOwGQAKOKhqHW~Bsfle2FFKSn4sBhMR3oHWp8p-QYxen~b99PvQ__&Key-Pair-Id=APKAQ4GOSFWCVNEHN3O4"
//               alt="logo"
//             />
//           </div>
//           <div class="main-overlay"></div>
//         </div>
//         <div class="main-bottom">
//           <p>Copyright © 2023 Captions. All Rights Reserved</p>
//         </div>
//       </div>
//     </div>
//   </body>
// </html>

// `
// }
