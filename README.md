# AWS Cognito

Authenticate manually to AWS Cognito. This is useful if you do not want to use the hosted UI.

### Cognito CLI

To use the following commands the user pool id and/or the app client is required.

#### List users in pool

```shell
aws cognito-idp list-users --user-pool-id <UserPoolId>
```

#### Sign up

Create a new user

```shell
aws cognito-idp sign-up --client-id <ClientID> --username <Username> --password <Password>
```

#### Initiate authentication

Authenticate a user.

```shell
aws cognito-idp initiate-auth --client-id <ClientID> --auth-flow USER_PASSWORD_AUTH --auth-parameters "USERNAME=<User>,PASSWORD=<Password>"
```

#### Respond to challenge

When a user is first created, a password is automatically created and the user is required to update its password before he can authenticate. Use the respond challenge to update the user password. The sessionID is given by the call to initiate auth.

```shell
aws cognito-idp admin-respond-to-auth-challenge --user-pool-id <UserPoolId> --client-id <ClientId> --challenge-name NEW_PASSWORD_REQUIRED --challenge-responses "USERNAME=<Username>,NEW_PASSWORD=<NewPassword>" --session <SessionID>
```

#### Forgot password

Send email to a user with a code to reset their password.

```shell
aws cognito-idp forgot-password --client-id <ClientId> --username <UserName>
```

#### Reset password

Reset the password with the confirmation code from forgot-password.

```shell
aws cognito-idp confirm-forgot-password --client-id <ClientId> --username <Username> --password <NewPassword> --confirmation-code <ConfirmationCode>
```

#### Set user password

Set the user password. Does not require to send the confirmation code.

```shell
aws cognito-idp admin-set-user-password --user-pool-id <UserPoolId> --username <Username> --password <Password> --permanent
```

