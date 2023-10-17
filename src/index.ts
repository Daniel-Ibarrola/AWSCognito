import axios from "axios";
import { Command } from "commander";
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


const updatePassword = async (user: string, newPassword: string, code: string) => {
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
    return response.status;
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

const userLogin = async () => {

    console.log("Login to AWS Cognito");
    const user = await getInput("Enter your username or email: ");
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

const forgotPassword = async () => {
    console.log("Request password reset");

    const user = await getInput("Enter your username or email: ");
    rl.close();

    try {
        const response = await requestPasswordReset(user);
        if (response.CodeDeliveryDetails) {
            console.log("A confirmation code has been sent to your email.");
        } else {
            console.log("Failed to send confirmation code");
        }
    } catch (error) {
        console.log("Error:", error.message);
        console.log(error);
    }

};


const resetPassword = async () => {
    console.log("Reset your password");
    const user = await getInput("Enter your username or email: ");
    const code = await getInput("Enter your confirmation code: ");
    rl.close();

    const password = getPassword('Enter your new password: ');

    try {
        const status = await updatePassword(user, password, code);
        if (status === 200){
            console.log("Password updated successfully");
        } else {
            console.log("Failed to update password");
        }
    } catch (error) {
        console.log("Error:", error.message);
        console.log(error);
    }
};


const main = async () => {
    const program = new Command();
    program
        .name("AWS Cognito Authenticator.")
        .description("CLI to authenticate with AWS Cognito.")
        .version("0.1.0");

    program
        .command("login")
        .description("Login with AWS Cognito and get an access token.")
        .action(userLogin);

    program
        .command("forgot-password")
        .description("Request a password reset in case you forgot your password.")
        .action(forgotPassword);

    program
        .command("reset-password")
        .description("Reset your password.")
        .action(resetPassword);

    await program.parseAsync(process.argv);
}


(async () => {
    await main();
})();