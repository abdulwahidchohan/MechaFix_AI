const fs = require('fs');
const path = require('path');

function fixPrivateKey(key) {
  if (!key) return key;
  let formatted = key.replace(/\\n/g, "\n").replace(/\r/g, "");
  
  const header = "-----BEGIN PRIVATE KEY-----";
  const footer = "-----END PRIVATE KEY-----";
  
  if (formatted.includes(header) && formatted.includes(footer)) {
    const parts = formatted.split(header);
    const bodyAndFooter = parts[1].split(footer);
    let body = bodyAndFooter[0].replace(/\s+/g, "");
    
    if (body.length % 4 === 1) {
      body = body.slice(0, -1);
    } else if (body.length % 4 === 2) {
      body = body + "==";
    } else if (body.length % 4 === 3) {
      body = body + "=";
    }
    
    const chunkedBody = [];
    for (let i = 0; i < body.length; i += 64) {
      chunkedBody.push(body.slice(i, i + 64));
    }
    
    return `${header}\n${chunkedBody.join("\n")}\n${footer}\n`;
  }
  
  return formatted;
}

const rawPrivateKey = "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQD13QzFRxs+9O6y\nMJcWigxzFOxZB9eJew7NxOl0EgU6wuskttO0/5b7UMIaEXxwyGUdrFAWPQMegLWM\nLqcu8VC6ev/OSad4oge+nRVUtHSsutxUv0kB0vW6j3G/5utYltayGVd5tHanf4dX\n0UM+uzzXo4p3bg5EGKpliggRc+yxOtC6RDykSfTa6fUz++v6ATNnJEndq8yTm1bA\nWBdh2ok7b+VbbSdYGf+lRe9MaEB5mvFp/uOzQE+PRNT5AsAlTD5MxpcelmF1JxYR\nBAo52tqYcX149zdBH5AeZuMjoIWoZZ56oAsMBmymS2d0RitEJfwsPMOM7gOG0sjA\n16YMsX7hAgMBAAECggEAMgTftT7rHxrLePsDsfUx5TPLha1fvzuG3nwCFrgX0kWX\neyeq2HbrK4PZiV4nV/adA7VrsaqF+O2sgbF4F8fGabneUwSPCq7ELpZcoZf46K83\nZhJocvONRIAsXyNGnAZL9X3MWxlIznjWexo6uQd0sFY4NGXyhw4RlIjJbWuNKtzr\nREj61fgn8x5iNpZd7Yh9FPlTgFleJ4TT0OoAhGIci3eygRsVbiPPPV9O5mfhq8g4\nC8VPV3EeBWDJgaL7obVsYHxc+ly8N5sbwe/cBkUwF9+kbNTTpEWOoVAdrSv1wQQ/\nEUAxQe+kTZRDyQfPZwrGB2Nm6yULVZ8RjqA3DV7ZVQKBgQD+uKzitEombBUj7vPy\nFHg05VSJapJDcPUkgyNUC/YZy2ZKwp7SxTr1AvM58+oRBqCrB6261U2cRofic8i1\nMLU9NmCtr9nL5KEZfP+/yztQlQ7NLzjKR8OSDX+7hd4a7WtcGUPkb5rJvByunW4Y\nSTrk4lyLAzc46UnnpD8++pwxdwKBgQD3GP3q/4NtXoYR5iaDpI1+lagwjFnUE7Yq\nJDXoIqwt5TG22DbAYU9qJykiVUV8H4PoQ3R8glCGMSALEdd2Xmv+V/QaCMS20C+Y\nwQewoj/MbS9q6Fqri+mst1GBpEtp7KYyrxkEJMjBDic+/MDo+OsIMaL3JlotqGni\n5zjswJkoZwKBgHcHk3qI51GXFjXpdsN7/0QwmlVwoJK1WUjLoxmmUUVygAWVdqRl\nmAxgaYp+SbXVFAV4HB3/iTnq15rhojvRXBATtg/T6gHWf9WqTNSyQrCARx9o3q/f\n4yr/9d2KS+TnZ1DtWYWJBZsZtYl/dbARoFzOzpIDWa3VjjyZyxhCAfU3AoGBAKBu\nqpZEldmR8Kx4aPM6COByXMRArCYlMjZEUnfI40/dKp0T3uCjjcNXb76p7LZ9Y9CO\n03fvyEaIaMynJeTlw2pdQtEQdmBX5T9hvRNzFMcu8QWRnSUab3rDf3kT6h75FqN7\nyltFYs7t2I9t3falfzxPtgaP8ScJ3M4E4JHfLtHrAoGBAMGinEINBUXgcF+YVuBa\nsz19Jixfn25ly8+ry8xvzgT1MDHeHaL7VF7SwRMJSLYioEKi6va7favfmguA0QT3\nrHgkPWrNVJXSn2eUYPsoIuvkSvOkWSXaOhNLFh+3f+fakI9ojTfeywHXTFPn1JZM\nYfl1CmdYwdwHUgu7ixwAZvRH/\n-----END PRIVATE KEY-----\n";

const serviceAccount = {
  type: "service_account",
  project_id: "hekto-awm",
  private_key_id: "4acadac4a53ca958a577bd896382d3fc73ac6f1b",
  private_key: fixPrivateKey(rawPrivateKey),
  client_email: "firebase-adminsdk-fbsvc@hekto-awm.iam.gserviceaccount.com",
  client_id: "110013724957660874487",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40hekto-awm.iam.gserviceaccount.com",
  universe_domain: "googleapis.com"
};

const jsonStr = JSON.stringify(serviceAccount);

const envContent = `# GEMINI_API_KEY: Required for Gemini AI API calls.
GEMINI_API_KEY="AIzaSyAG3RnStRI6WqKh7U1CHONNvAoI9f8DA3I"

# Model Configurations
GEMINI_DIAGNOSIS_MODEL="gemini-3.6-flash"
GEMINI_FAST_MODEL="gemini-3.5-flash-lite"
GEMINI_IMAGE_MODEL="gemini-3.1-flash-image"
GEMINI_EMBEDDING_MODEL="gemini-embedding-2"
ENABLE_REFERENCE_DIAGRAMS="false"
RAG_MODE="tfidf"

# APP_URL: The URL where this applet is hosted.
APP_URL="https://mecha-fix-ai.vercel.app"
NEXT_PUBLIC_APP_URL="https://mecha-fix-ai.vercel.app"

# Public Firebase Configuration (Client)
NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSyDpJRYKZQraLQhEisCgNEmLnCB-fVi-7-M"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="hekto-awm.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="hekto-awm"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="hekto-awm.firebasestorage.app"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="920507935916"
NEXT_PUBLIC_FIREBASE_APP_ID="1:920507935916:web:addb2991a3546f2ea70309"
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID="G-8Q29K5XQ8H"

# Firebase Admin Credentials (Server)
FIREBASE_SERVICE_ACCOUNT_KEY='${jsonStr}'
`;

const envPath = path.join(__dirname, '..', '.env.local');
fs.writeFileSync(envPath, envContent, 'utf8');
console.log('Successfully updated .env.local with Gemini API settings');
