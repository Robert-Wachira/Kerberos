const kerberos = require("kerberos");

// Set up the KDC and the database of principals and keys
const realm = "EXAMPLE.COM";
const kdc = "kdc.example.com";
const admin = "admin";
const password = "password";

const principals = [
  { principal: "admin", password: password },
  { principal: "user1", password: "user1password" },
  { principal: "user2", password: "user2password" },
  { principal: "app1", password: "app1key" },
  { principal: "app2", password: "app2key" },
];

principals.forEach(({ principal, password }) => {
  kerberos.createPrincipal(
    {
      principal: `${principal}@${realm}`,
      password,
      kvno: 1,
      enctype: "aes256-cts-hmac-sha1-96",
      noAutoReturn: true,
    },
    function (err) {
      if (err) {
        console.log(`Error creating principal ${principal}@${realm}: ${err}`);
      } else {
        console.log(`Principal ${principal}@${realm} created successfully.`);
      }
    }
  );
});

// Authenticate the user using the AS
const user = "user1";
const userPassword = "user1password";

kerberos.auth(
  {
    username: user,
    password: userPassword,
    realm: realm,
    hostname: kdc,
    service: "krbtgt",
  },
  function (err, client) {
    if (err) {
      console.log(`Error authenticating user ${user}: ${err}`);
    } else {
      console.log(`User ${user} authenticated successfully.`);
      // Obtain a service ticket for the application server using the TGS
      kerberos.initializeClient(`app1@${realm}`, function (err, context) {
        if (err) {
          console.log(`Error initializing client for app1: ${err}`);
        } else {
          kerberos.step(context, "", function (err, result) {
            if (err) {
              console.log(`Error obtaining service ticket for app1: ${err}`);
            } else {
              console.log(`Service ticket obtained for app1: ${result}`);
              // Access the application server using the service ticket
              kerberos.wrap(context, "Hello, world!", function (err, wrapped) {
                if (err) {
                  console.log(`Error wrapping data for app1: ${err}`);
                } else {
                  console.log(`Data wrapped successfully: ${wrapped}`);
                  // send wrapped data to the application server
                }
              });
            }
          });
        }
      });
    }
  }
);
