// const express = require("express");
// const SpotifyWebApi = require("spotify-web-api-node");
// const config = require("./config");
// const app = express();
// const port = 3000;
// const axios = require("axios");
// let currentUserDetails;
// // Create a Spotify API instance
// console.log("spotify cred= ", config.spotifyCredentials);
// const spotifyApi = new SpotifyWebApi({
//   clientId: config.spotifyCredentials.CLIENT_ID,
//   clientSecret: config.spotifyCredentials.CLIENT_SECRET,
//   redirectUri: config.spotifyCredentials.REDIRECT_URL,
// });

// app.use(express.json());
// // Set up routes

// // Redirect to Spotify login
// app.get("/login", (req, res) => {
//   try {
//     const scopes = [
//       "user-read-private",
//       "user-read-email",
//       "playlist-read-private",
//       "playlist-read-collaborative",
//       "playlist-modify-private",
//       "playlist-modify-public",
//     ];
//     const authorizeURL = spotifyApi.createAuthorizeURL(scopes, "", true);
//     res.redirect(authorizeURL);
//   } catch (err) {
//     console.log("err logging in");
//     res.status(500).send(err);
//   }
// });

// // Handle callback after login
// app.get("/callback", async (req, res) => {
//   const { code } = req.query;

//   try {
//     const data = await spotifyApi.authorizationCodeGrant(code);
//     const { access_token, refresh_token } = data.body;

//     // Set the access token to make Spotify API requests
//     console.log("access token=", access_token);
//     spotifyApi.setAccessToken(access_token);
//     spotifyApi.setRefreshToken(refresh_token);

//     let userPlaylists;
//     //get me
//     const me = await spotifyApi.getMe();
//     console.log("me=", me.body);

//     currentUserDetails = me.body;
//     res.send(
//       `Logged in! You can now use the Spotify API. Access token= ${access_token}`
//     );
//   } catch (error) {
//     console.error("Error getting access token:", error);
//     res.status(500).send("Error getting access token");
//   }
// });

// // Get user's playlist
// app.get("/playlists", async (req, res) => {
//   try {
//     const userId = currentUserDetails.uri.split("spotify:user:")[1];

//     const userPlaylistsResponse = await spotifyApi.getUserPlaylists(userId);

//     const playlists = userPlaylistsResponse.body.items;
//     // console.log("playlists=", playlists);
//     const trackMap = mergePlaylists(playlists);
//     res.status(200).json(playlists);
//   } catch (err) {
//     console.log("err in playlists=", err);
//     res.status(500).send(`"err playlists ${err}`);
//   }
// });

// // convert short links- https://spotify.app.link/X0hI4TzeIDb?_p=c91c29c098057af1e21d90ffe9b0
// // https://open.spotify.com/playlist/4R5rdkTCoyq8uW3SodrryX
// app.post("/openlink", async (req, res) => {
//   try {
//     console.log("req body= ", req.body);
//     const url = req.body.url;
//     let result = await axios.get(url, {
//       maxRedirects: 5,
//     });
//     console.log("result=", result);
//     // console.log("result=", Object.keys(result));
//     // console.log("headers=", Object.keys(result.request));
//     // console.log("response url= ", result.config.url);
//     // console.log("response url=", result.request.res.responseUrl);

//     // result = await axios.get(result.request.res.responseUrl, {
//     //   maxRedirects: 5,
//     // });
//     // console.log("result=", result);
//     res.status(200).json(result);
//   } catch (err) {
//     console.log("err in converting link=", err);
//     res.status(500).send("Error in api ");
//   }
// });

// // Add a catch-all route for invalid routes
// app.use((req, res) => {
//   // Redirect to a predefined route, e.g., the home page
//   res.redirect("/login");
// });
// // Start the server
// app.listen(port, () => {
//   console.log(`Server is running on http://localhost:${port}`);
// });

// const mergePlaylists = async (playlists) => {
//   try {
//     const tracksMap = new Map();
//     for (const playlist of playlists) {
//       const getPlaylistItemsResponse = await spotifyApi.getPlaylistTracks(
//         playlist.id
//       );
//       //   console.log(
//       //     `tracks for playlist id ${playlist.id}= \n`,
//       //     getPlaylistItemsResponse.body.items.length
//       //   );
//       const tracks = getPlaylistItemsResponse.body.items;
//       tracks.forEach((trackObj) => {
//         if (tracksMap.has(trackObj.track.id)) {
//           tracksMap.set(
//             trackObj.track.id,
//             tracksMap.get(trackObj.track.id) + 1
//           );
//         } else {
//           tracksMap.set(trackObj.track.id, 1);
//         }
//       });
//     }
//     console.log("map=", tracksMap);
//     return tracksMap;
//   } catch (err) {
//     console.log("error in mergePlaylists= ", err);
//   }
// };

////////////////////////////////////////////////////////
const express = require("express");
const config = require("./config");
const request = require("request");
const port = 5000;

var spotify_client_id = config.spotifyCredentials.CLIENT_ID;
var spotify_client_secret = config.spotifyCredentials.CLIENT_SECRET;
var spotify_redirect_url = config.spotifyCredentials.REDIRECT_URL;

const app = express();
app.use(express.json());
var cors = require("cors");
app.use(cors());
let access_token;
const generateRandomString = function (length) {
  let text = "";
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

app.get("/auth/token", (req, res) => {
  console.log("access_token=", access_token);
  res.status(200).json({
    status: "success",
    access_token: access_token,
  });
});

app.get("/auth/login", (req, res) => {
  console.log("LOGIN");
  const scopes = [
    "user-read-private",
    "user-read-email",
    "playlist-read-private",
    "playlist-read-collaborative",
    "playlist-modify-private",
    "playlist-modify-public",
  ];

  var state = generateRandomString(16);

  var auth_query_parameters = new URLSearchParams({
    response_type: "code",
    client_id: spotify_client_id,
    scope: scopes.join(" "),
    redirect_uri: "http://localhost:5000/auth/callback",
    state: state,
  });

  res.redirect(
    "https://accounts.spotify.com/authorize/?" +
      auth_query_parameters.toString()
  );
});

app.get("/auth/callback", (req, res) => {
  var code = req.query.code;

  var authOptions = {
    url: "https://accounts.spotify.com/api/token",
    form: {
      code: code,
      redirect_uri: "http://localhost:5000/auth/callback",
      grant_type: "authorization_code",
    },
    headers: {
      Authorization:
        "Basic " +
        Buffer.from(spotify_client_id + ":" + spotify_client_secret).toString(
          "base64"
        ),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    json: true,
  };

  request.post(authOptions, function (error, response, body) {
    if (!error && response.statusCode === 200) {
      access_token = body.access_token;
      res.redirect("http://localhost:19006/");
    }
  });
});

app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}`);
});
