import os
import base64
import json
from flask import Flask, render_template, request, jsonify
from werkzeug.utils import secure_filename
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'uploads'

# Configure the Gemini API key
api_key = os.environ.get("GEMINI_API_KEY")
if not api_key:
    raise ValueError("GEMINI_API_KEY not found in .env file")
genai.configure(api_key=api_key)

# Ensure the upload folder exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/analyze', methods=['POST'])
def analyze():
    if 'video' not in request.files:
        return jsonify({'error': 'No video file found'})

    video_file = request.files['video']
    if video_file.filename == '':
        return jsonify({'error': 'No selected file'})

    if video_file:
        filename = secure_filename(video_file.filename)
        video_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        video_file.save(video_path)

        # Use Gemini API for analysis
        try:
            model = genai.GenerativeModel('gemini-1.5-pro')
            print('printed')
            # print(genai.ListModels)
            with open(video_path, 'rb') as video:
                video_data = video.read()
            response = model.generate_content(
                ["Analyze the face shape in the video using the parameters such as 1. Face Length:  Measured from the center of the hairline to the tip of the chin. 2. Forehead Width:  Measured across the forehead, from hairline to hairline. 3. Cheekbone Width:  Measured across the cheekbones, from one cheekbone to the other, at their widest point. 4. Jawline Width:  Measured across the jawline, from the widest point on one side to the widest point on the other. Can be estimated by measuring from the ear to the chin and doubling it. 5. Jawline Angle:  The angle of the jawline (sharp or soft) is also a key factor, and return the type of face shape the user has and why you believe so, the response should be just a cheeky one liner telling his/her type.",
                 {'mime_type': 'video/webm', 'data': video_data}]
            )
            face_shape = response.text.strip()
            message = face_shape
            response_data = {
                'faceShape': face_shape,
                'message': message
            }
        except Exception as e:
            response_data = {'error': str(e)}
        finally:
            # Clean up the uploaded file
            os.remove(video_path)

        return jsonify(response_data)

if __name__ == '__main__':
    app.run(debug=True)