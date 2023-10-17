import axios from "axios";
import * as dotenv from "dotenv";
import * as readline from "readline";
import * as readlineSync from 'readline-sync';

dotenv.config();

const cognitoURL = `https://cognito-idp.${process.env.REGION}.amazonaws.com/`;
const clientId = process.env.CLIENT_ID;

const authenticate = async (user: string, password: string) => {
    const data = {
        AuthParameters: {
            USERNAME: user,
            PASSWORD: password,
        },
        AuthFlow: 'USER_PASSWORD_AUTH',
        ClientId: clientId,
    };

    const headers = {
        'X-Amz-Target': 'AWSCognitoIdentityProviderService.InitiateAuth',
        'Content-Type': 'application/x-amz-json-1.1',
    };

    const response = await axios.post(cognitoURL, data, { headers })
    return response.data;
};

const setNewPassword = async (user: string, newPassword: string, session: string) => {
    const data = {
        ChallengeName: "NEW_PASSWORD_REQUIRED",
        ChallengeResponses: {
            USERNAME: user,
            NEW_PASSWORD: newPassword
        },
        ClientId: clientId,
        Session: session
    }

    const headers = {
        'X-Amz-Target': 'AWSCognitoIdentityProviderService.RespondToAuthChallenge',
        'Content-Type': 'application/x-amz-json-1.1',
    };

    const response = await axios.post(cognitoURL, data, { headers })
    return response.data;
};


const requestPasswordReset = async (user: string) => {
    const data = {
        ClientId: clientId,
        Username: user
    }

    const headers = {
        'X-Amz-Target': 'AWSCognitoIdentityProviderService.ForgotPassword',
        'Content-Type': 'application/x-amz-json-1.1',
    };

    const response = await axios.post(cognitoURL, data, { headers })
    return response.data;
};


const resetPassword = async (user: string, newPassword: string, code: string) => {
    const data = {
        ClientId: clientId,
        ConfirmationCode: code,
        Password: newPassword,
        Username: user
    }

    const headers = {
        'X-Amz-Target': 'AWSCognitoIdentityProviderService.ConfirmForgotPassword',
        'Content-Type': 'application/x-amz-json-1.1',
    };

    const response = await axios.post(cognitoURL, data, { headers })
    return response.data;
}


const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

const getInput = (prompt: string): Promise<string> => {
    return new Promise(resolve => {
        rl.question(prompt, (answer) => {
            resolve(answer);
        })
    });
}

const getPassword = (prompt: string): string => {
    return readlineSync.question(prompt, {
        hideEchoBack: true,
    });
}

const handleResponse = async () => {

    console.log("Login to AWS Cognito");
    const user = await getInput("Enter your email: ");
    const password = getPassword('Enter your password: ');
    rl.close();

    try {
        const response = await authenticate(user, password);

        if (response.AuthenticationResult) {
            console.log('Authentication successful\n');
            console.log('AccessToken:', response.AuthenticationResult.AccessToken, '\n');
            console.log('IdToken:', response.AuthenticationResult.IdToken, '\n');
            console.log('RefreshToken:', response.AuthenticationResult.RefreshToken, '\n');
        } else if (response.ChallengeName === 'NEW_PASSWORD_REQUIRED') {
            // First time login. User needs to set a new password
            console.log('User needs to set a new password');
            const newPassword = getPassword("Enter new password: ");
            const session: string = response.Session;
            try {
                await setNewPassword(user, newPassword, session);
                console.log("New password set successfully");
            } catch (error){
                console.log("Failed to set new password");
                console.log(error);
            }

        } else {
            console.error('Unknown response format');
        }
    } catch (error) {
        console.log("Error:", error.message);
        console.log(error);
    }
};

(async () => {
    await handleResponse();
})();
