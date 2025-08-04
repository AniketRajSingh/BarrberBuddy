# BarberBuddy Web AR Interface

BarberBuddy AR Interface is a web-based application that uses your webcam to let you try on different hairstyles in real-time using 3D models. It leverages face tracking to accurately place the virtual hairstyle on your head.

## Features

*   **Real-time 3D Hairstyle Try-On:** Uses your webcam to overlay 3D hairstyle models on your head in real-time.
*   **Face Shape Detection:** Analyzes your face shape to recommend suitable hairstyles.
*   **Hairstyle Switching:** Allows you to switch between different hairstyles.

## How to Run

To run this project locally, you need to serve the files using a local web server.

1.  **Prerequisites:** Make sure you have [Node.js](https://nodejs.org/) installed, which includes `npm`.
2.  **Start the Server:** Open your terminal in the root directory of the project and run the following command:
    ```bash
    npx http-server
    ```
    or 

    Use the live server extention on the vscode to view the index.html file

3.  **View in Browser:** Open your web browser and navigate to the local address provided by the server (e.g., `http://localhost:8080` or 'localhost:5500).
4.  **Enable Webcam:** Grant the browser permission to access your webcam when prompted. You should now see the application running.

## Face Shape Detection Setup

To run the face shape detection feature, you need to set up a Python environment and run the Flask server.

1.  **Create a Virtual Environment:**
    ```bash
    python3 -m venv .venv
    ```

2.  **Activate the Virtual Environment:**
    *   **On macOS and Linux:**
        ```bash
        source .venv/bin/activate
        ```
    *   **On Windows:**
        ```bash
        .venv\Scripts\activate
        ```

3.  **Install Dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

4.  **Run the Flask Server:**
    ```bash
    python app.py
    ```
    or use the default code runner in the vscode

5.  **Access the Application:** Open `[Face_Detector](http://127.0.0.1:5000)` in your browser.

## Adding New 3D Hairstyles

The project uses Three.js legacy JSON format for models. If you have a model in `.glb` or `.gltf` format, you can convert it using the following process.

1.  **Initial Setup:**
    Navigate to the `glb-to-json` directory and install the necessary packages.
    ```bash
    cd glb-to-json
    npm install three
    npm install -g gltf-pipeline # If not already installed globally
    ```

2.  **Convert GLB to GLTF:**
    Place your `.glb` file in the `glb-to-json` directory and run:
    ```bash
    gltf-pipeline -i your-model.glb -o your-model.gltf --separate
    ```
    This will generate a `.gltf` file, a `.bin` file, and texture images.
    (We need textures, we'll get that from here)

3.  **Convert GLB to JSON:**
    Update the `convert-glb-to-json.js` script to point to your new `.glb` file, then run:
    ```bash
    node convert-glb-to-json.js
    ```
    This will create the final `.json` model file.

4.  **Cleanup:** You can delete the `.bin`, `.gltf`, and `.glb` files after the process is complete.

5.  **Integrate:** Move the new `.json` file and its textures to the `models/hairstyle` directory and add the model data in `models.json`.

## Project Structure

Here is an overview of the key files and directories in the project.

*   `index.html`: The main HTML file that structures the web page and includes all the necessary scripts.
*   `main.js`: The core application logic. It initializes the face tracking, sets up the Three.js 3D scene, loads the hairstyle and face models, and manages the render loop.
*   `faceshape.html`: The HTML file for the face shape detection feature.
*   `faceshape.js`: The JavaScript file for the face shape detection feature.
*   `app.py`: The Python backend for the face shape detection feature.
*   `readme.md`: This file, providing information about the project.

*   `appearance/`: Contains front-end assets.
    *   `style.css`: The stylesheet for the application's UI.
    *   `widget.js`: A script for UI components or widgets.

*   `libs/`: Contains third-party JavaScript libraries.
    *   `three.js`: The core Three.js library for 3D rendering.
    *   `jeelizFaceFilter.js`: The main library for browser-based face detection and tracking.
    *   `JeelizResizer.js` & `JeelizThreeHelper.js`: Helper scripts to integrate Jeeliz FaceFilter with Three.js.
    *   `addDragEventListener.js`: A utility script to allow dragging and repositioning the 3D hairstyle model.

*   `models/`: Contains the 3D model assets.
    *   `face/faceLowPolyEyesEarsFill2.json`: A low-polygon 3D model of a face used to occlude the user's own hair.
    *   `hairstyle/hairstyle.json`: The default 3D hairstyle model.

*   `neuralNets/`:
    *   `NN_DEFAULT.json`: The pre-trained neural network model used by Jeeliz FaceFilter for its detection algorithm.

*   `glb-to-json/`: A utility folder with a script to convert `.glb` models to the Three.js JSON format required by the application.

## Dependencies

*   **[Three.js](https://threejs.org/):** A cross-browser JavaScript library and API used to create and display animated 3D computer graphics in a web browser.
*   **[Jeeliz FaceFilter](https://github.com/jeeliz/jeelizFaceFilter):** A JavaScript library for real-time face tracking and detection from the webcam video stream.
*   **[gltf-pipeline](https://github.com/CesiumGS/gltf-pipeline):** A command-line tool for converting and optimizing GLTF assets. It is a development dependency used for the model conversion process.
*   **[Node.js](https://nodejs.org/):** Required to run the model conversion script and the local development server (`http-server`).

## Next Steps

*   **Get Hair Models:** We need to acquire some 3D hair models for India based hairstyles.
*   **UI/UX Improvement:** We need to enhance the user interface and experience.
*   **Integrate Face Shape Recognition:** Lastly we'll integrate the face shape recognition feature (`app.py`) with the main AR application. The application should:
    1.  Suggest the user's face shape.
    2.  Recommend hairstyles suited to that face shape.
    3.  Display thumbnails of the recommended hairstyles.
    4.  Render the selected 3D hairstyle model on the user's head when a thumbnail is clicked.