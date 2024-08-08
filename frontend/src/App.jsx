import React, { useState } from 'react';
import axios from 'axios';
import { useDropzone } from 'react-dropzone';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { AiOutlineClose, AiOutlineCloudUpload } from 'react-icons/ai';

const App = () => {
    const [files, setFiles] = useState([]);
    const [filePaths, setFilePaths] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [converting, setConverting] = useState(false);

    const { getRootProps, getInputProps } = useDropzone({
        onDrop: acceptedFiles => {
            setFiles([...files, ...acceptedFiles]);
        }
    });

    const handleRemoveFile = (index) => {
        const newFiles = [...files];
        newFiles.splice(index, 1);
        setFiles(newFiles);
    };

    const handleUpload = async () => {
        setUploading(true);
        const formData = new FormData();
        files.forEach(file => {
            formData.append('files', file);
        });

        const response = await axios.post('http://localhost:5000/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });

        if (response.status === 200) {
            setFilePaths(response.data.file_paths);
        }
        setUploading(false);
    };

    const handleConvert = async () => {
        setConverting(true);
        const response = await axios.post('http://localhost:5000/convert', { file_paths: filePaths }, {
            responseType: 'blob'
        });

        if (response.status === 200) {
            const zipBlob = response.data;
            if (files.length === 1) {
                saveAs(zipBlob, `${files[0].name.split('.').slice(0, -1).join('.')}.jpeg`);
            } else {
                saveAs(zipBlob, 'converted_images.zip');
            }
        }
        setConverting(false);
        setFiles([]);
        setFilePaths([]);
    };

    const handleClear = async () => {
        await axios.post('http://localhost:5000/clear');
        setFiles([]);
        setFilePaths([]);
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white">
            <h1 className="text-4xl font-bold mb-4">its12 File Converter</h1>
            <p className="text-xl mb-8">Convert PDFs to JPEGs.</p>
            <div {...getRootProps()} className="w-64 p-4 border-2 border-dashed border-gray-400 rounded-md cursor-pointer bg-gray-800">
                <input {...getInputProps()} />
                <div className="flex flex-col items-center">
                    <AiOutlineCloudUpload className="text-6xl mb-2" />
                    <p className="text-center">Drop your files here</p>
                </div>
            </div>
            <ul className="mt-4 w-64">
                {files.map((file, index) => (
                    <li key={index} className="flex justify-between items-center mt-2 bg-gray-700 p-2 rounded shadow-md">
                        {file.name}
                        <button onClick={() => handleRemoveFile(index)} className="text-red-500 ml-4">
                            <AiOutlineClose />
                        </button>
                    </li>
                ))}
            </ul>
            <div className="flex mt-8">
                <button
                    onClick={handleUpload}
                    className={`bg-blue-500 text-white py-2 px-4 rounded mr-4 flex items-center ${uploading || filePaths.length > 0 || files.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={uploading || filePaths.length > 0 || files.length === 0}
                >
                    {uploading ? 'Uploading...' : 'Upload'}
                </button>
                <button
                    onClick={handleConvert}
                    className={`bg-green-500 text-white py-2 px-4 rounded mr-4 flex items-center ${converting || filePaths.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={converting || filePaths.length === 0}
                >
                    {converting ? 'Converting...' : 'Convert'}
                </button>
                <button
                    onClick={handleClear}
                    className="bg-red-500 text-white py-2 px-4 rounded"
                >
                    Clear
                </button>
            </div>
        </div>
    );
};

export default App;
