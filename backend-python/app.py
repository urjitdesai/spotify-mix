from flask import Flask, redirect, request, session, url_for, jsonify
from flask_cors import CORS
import requests
import json

with open('./config.json', 'r')as file:
    spotify_config = json.load(file)
    print("spotify config=", spotify_config)

app = Flask(__name__)
CORS(app)
app.config['SECRET_KEY'] = 'supersecretkey'
app.config['SESSION_TYPE'] = 'filesystem'
app.config['SPOTIFY_CLIENT_ID'] = spotify_config['SPOTIFY_CREDENTIALS']['CLIENT_ID']
app.config['SPOTIFY_CLIENT_SECRET'] = spotify_config['SPOTIFY_CREDENTIALS']['CLIENT_SECRET']
app.config['SPOTIFY_REDIRECT_URI'] = spotify_config['SPOTIFY_CREDENTIALS']['REDIRECT_URL']

AUTH_URL = 'https://accounts.spotify.com/authorize'
TOKEN_URL = 'https://accounts.spotify.com/api/token'
BASE_URL = 'https://api.spotify.com/v1/'

ACCESS_TOKEN = None


@app.route('/login')
def login():
    auth_query_parameters = {
        "response_type": "code",
        "redirect_uri": app.config['SPOTIFY_REDIRECT_URI'],
        "scope": "user-library-read playlist-read-private playlist-modify-public playlist-modify-private",
        "client_id": app.config['SPOTIFY_CLIENT_ID']
    }
    resp = requests.get(AUTH_URL, params=auth_query_parameters)
    print("resp=", resp.url)
    return redirect(resp.url)


@app.route('/callback')
def callback():
    auth_token = request.args['code']
    code_payload = {
        "grant_type": "authorization_code",
        "code": auth_token,
        "redirect_uri": app.config['SPOTIFY_REDIRECT_URI'],
        "client_id": app.config['SPOTIFY_CLIENT_ID'],
        "client_secret": app.config['SPOTIFY_CLIENT_SECRET']
    }
    post_resp = requests.post(TOKEN_URL, data=code_payload)
    response_data = post_resp.json()
    print("\naccess token=", response_data['access_token'])
    ACCESS_TOKEN = response_data['access_token']
    session['access_token'] = response_data["access_token"]
    session['refresh_token'] = response_data["refresh_token"]
    session['token_type'] = response_data["token_type"]
    session['expires_in'] = response_data["expires_in"]

    return redirect(url_for('get_playlists'))


@app.route('/playlists')
def get_playlists():
    headers = {"Authorization": f"Bearer {session['access_token']}"}
    resp = requests.get(BASE_URL + "me/playlists", headers=headers)
    return jsonify(resp.json())


@app.route('/auth/token')
def get_access_token():
    print('ACCESS_TOKEN=', ACCESS_TOKEN)
    if (ACCESS_TOKEN):
        print('ACCESS_TOKEN=', ACCESS_TOKEN)
        return {
            "status": 'success',
            "access_token": ACCESS_TOKEN,
        }
    else:
        return {
            "status": 'fail',
        }


@app.route('/tracks', methods=['POST'])
def get_tracks():
    # playlist_ids = request.json.get('playlists', [])
    print('req.get_json=', request.get_json())
    playlist_ids = request.get_json()['playlists']

    all_tracks = []

    if (request.headers.get('Authorization')):
        session['access_token'] = request.headers.get('Authorization')

    headers = {"Authorization": f"Bearer {session['access_token']}"}

    tracksMap = {}
    # {
    #   <trackid>: { track: <trackObj>, count: <integer>}
    # }
    for playlist_id in playlist_ids:
        resp = requests.get(
            BASE_URL + f"playlists/{playlist_id}/tracks", headers=headers)
        print('resp.json()=', resp.json())
        playlistTrackObjects = resp.json().get('items', [])
        all_tracks.extend([track['track']
                          for track in playlistTrackObjects if track['track']])
        print('all_tracks=', len(all_tracks))
        for track in playlistTrackObjects:
            if (track['track']['id'] in tracksMap):
                tracksMap[track['track']['id']] = {
                    'track': track['track'],
                    'count': tracksMap[track['track']['id']]['count']+1
                }
            else:
                tracksMap[track['track']['id']] = {
                    'track': track['track'],
                    'count': 1
                }

    return jsonify(tracksMap)


@app.route('/getLongUrl',  methods=['POST'])
def get_long_url():
    short_url = request.get_json()['shortUrl']
    r = requests.head(short_url, allow_redirects=True)
    print("Long url= ", r.url)
    return r.url


@app.route('/create-playlist', methods=['POST'])
def create_playlist():
    trackIds = request.get_json()['trackIds']
    headers = {"Authorization": f"Bearer {session['access_token']}"}
    currentUserResponse = requests.get(
        BASE_URL+'me', headers=headers)
    currentUser = currentUserResponse.json()
    print("currentUser=", currentUser)
    return jsonify(currentUser)


if __name__ == '__main__':
    app.run(debug=True, port=3000)
