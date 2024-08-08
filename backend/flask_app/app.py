from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os
import shutil
import zipfile
import tempfile
from werkzeug.utils import secure_filename
import pdf2image

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = 'uploads/'
OUTPUT_FOLDER = 'output/'

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['OUTPUT_FOLDER'] = OUTPUT_FOLDER

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

@app.route('/upload', methods=['POST'])
def upload_files():
    file_paths = []
    if 'files' not in request.files:
        return jsonify({'error': 'No files part'}), 400

    files = request.files.getlist('files')

    for file in files:
        if file.filename == '':
            return jsonify({'error': 'No selected file'}), 400

        filename = secure_filename(file.filename)
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path)
        file_paths.append(file_path)

    return jsonify({'file_paths': file_paths}), 200

@app.route('/convert', methods=['POST'])
def convert_files():
    data = request.json
    file_paths = data.get('file_paths', [])

    if not file_paths:
        return jsonify({'error': 'No files to convert'}), 400

    for file_path in file_paths:
        images = pdf2image.convert_from_path(file_path)
        for i, image in enumerate(images):
            output_path = os.path.join(app.config['OUTPUT_FOLDER'], f"{os.path.splitext(os.path.basename(file_path))[0]}_page_{i + 1}.jpeg")
            image.save(output_path, 'JPEG')

    zip_filename = 'converted_images.zip'
    zip_filepath = os.path.join(tempfile.gettempdir(), zip_filename)

    with zipfile.ZipFile(zip_filepath, 'w') as zipf:
        for root, _, files in os.walk(app.config['OUTPUT_FOLDER']):
            for file in files:
                zipf.write(os.path.join(root, file), file)

    return send_file(zip_filepath, as_attachment=True, download_name=zip_filename)

@app.route('/clear', methods=['POST'])
def clear_files():
    for folder in [app.config['UPLOAD_FOLDER'], app.config['OUTPUT_FOLDER']]:
        for filename in os.listdir(folder):
            file_path = os.path.join(folder, filename)
            if os.path.isfile(file_path) or os.path.islink(file_path):
                os.unlink(file_path)
            elif os.path.isdir(file_path):
                shutil.rmtree(file_path)
    return '', 200

if __name__ == '__main__':
    app.run(debug=True)
