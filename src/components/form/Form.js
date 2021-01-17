import React, { useState } from "react";
import { useSelector } from "react-redux";
import { Chip, Paper, Divider, LinearProgress } from "@material-ui/core";
import imageCompression from "browser-image-compression";
import BorderColorIcon from "@material-ui/icons/BorderColor";
import VideocamRoundedIcon from "@material-ui/icons/VideocamRounded";
import YouTubeIcon from "@material-ui/icons/YouTube";
import AssignmentTurnedInIcon from "@material-ui/icons/AssignmentTurnedIn";
import CalendarViewDayIcon from "@material-ui/icons/CalendarViewDay";
import PhotoSizeSelectActualIcon from "@material-ui/icons/PhotoSizeSelectActual";
import EmojiEmotionsOutlinedIcon from "@material-ui/icons/EmojiEmotionsOutlined";
import CreateIcon from "@material-ui/icons/Create";
import firebase from "firebase";
import { v4 as uuid } from "uuid";
import db, { storage } from "../../firebase";
import { LinkedInBlue } from "../../assets/Colors";
import Styles from "./Style";

const Form = () => {
  const classes = Styles();
  const { displayName, photoURL } = useSelector((state) => state.user);

  const [uploadData, setUploadData] = useState({
    description: "",
    file: {
      type: "",
      name: "",
      data: "",
    },
  });

  const [progress, setProgress] = useState("");

  const uploadToFirebaseDB = (fileData) => {
    // uploading to collection called posts
    db.collection("posts")
      .add({
        profile: photoURL,
        username: displayName,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        description: uploadData.description,
        fileType: uploadData.file.type,
        fileName: uploadData.file.name,
        fileData: fileData,
      })
      .then(() => resetState());
  };

  const handleSubmitButton = (e) => {
    e.preventDefault();

    // verify atleast one of the input fields are not empyt
    if (uploadData.description || uploadData.file.data) {
      // if file input is true...upload the file to Fire-Store
      if (uploadData.file.data) {
        const id = uuid();
        const uploadTask = storage.ref(`posts/${id}`).putString(uploadData.file.data, "data_url");
        uploadTask.on(
          "state_changed",
          (snapshot) => {
            const value = Math.floor((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
            setProgress(value);
          },

          (error) => {
            alert(error);
          },

          () => {
            storage
              .ref("posts")
              .child(id)
              .getDownloadURL()
              .then((url) => uploadToFirebaseDB(url));
          }
        );

        // do not go further..
        return;
      }
      // if not file input provided
      uploadToFirebaseDB(uploadData.file.data);
    } else {
      alert("please enter something..");
    }
  };

  // if file name is too long.. compress it
  const fileNameCompressor = (str, limit) => {
    let fileName = str;
    const arr = str.split(".");
    const name = arr[0];
    const ext = arr[arr.length - 1];

    if (name.length > limit) {
      fileName = name.substring(0, limit).trim() + "... ." + ext;
    }
    return fileName;
  };

  const imageUploadHandler = async (e) => {
    const inputFile = e.target.files[0];
    const inputFileType = inputFile.type.split("/")[0];
    const inputFileName = fileNameCompressor(inputFile.name, 20);

    const fileSize = inputFile.size / (1024 * 1024);

    switch (inputFileType) {
      case "video":
        if (fileSize > 25) return alert("Select a video less than 25MB size");
        break;
      case "image":
        if (fileSize > 3) return alert("select an image less than 3MB size");
        break;
      default:
        break;
    }

    let compressedInputFile = inputFile;
    if (inputFileType === "image") {
      //compression algorithm
      const compressionOptions = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      };

      try {
        compressedInputFile = await imageCompression(inputFile, compressionOptions);
      } catch (error) {
        alert(error);
      }
    }

    let inputFileDataBase64;
    const file = new FileReader();
    if (compressedInputFile) {
      file.onloadend = (fileLoadedEvent) => {
        inputFileDataBase64 = fileLoadedEvent.target.result;
        setUploadData({
          ...uploadData,
          file: {
            type: inputFileType,
            name: inputFileName,
            data: inputFileDataBase64,
          },
        });
      };
      file.readAsDataURL(compressedInputFile);
    }

    // clear the file input event value
    e.target.value = "";
  };

  const resetState = () => {
    setUploadData({
      description: "",
      file: {
        type: "",
        name: "",
        data: "",
      },
    });
    setProgress("");
  };

  return (
    <Paper className={classes.upload}>
      <div className={classes.upload__header}>
        <form className={classes.header__form} onSubmit={handleSubmitButton}>
          <CreateIcon />
          <input
            placeholder="Start a post"
            value={uploadData.description}
            onChange={(e) => setUploadData({ ...uploadData, description: e.target.value })}
          />
          <input
            id="upload-image"
            type="file"
            accept="image/*,image/heif,image/heic,video/*,video/mp4,video/x-m4v,video/x-matroska,.mkv"
            hidden
            onChange={imageUploadHandler}
          />
          <button type="submit">Post</button>
        </form>
      </div>
      {uploadData.file.name && !progress && (
        <div className={classes.selectedFile}>
          <Chip
            color="primary"
            size="small"
            onDelete={resetState}
            icon={
              uploadData.file.type === "image" ? (
                <PhotoSizeSelectActualIcon />
              ) : (
                <VideocamRoundedIcon />
              )
            }
            label={uploadData.file.name}
          />
        </div>
      )}
      {progress ? (
        <div className={classes.uploading}>
          <LinearProgress variant="determinate" value={progress} className={classes.progress} />
          <p>{progress} %</p>
        </div>
      ) : (
        ""
      )}

      <div className={classes.upload__media}>
        <label htmlFor="upload-image" className={classes.media__options}>
          <PhotoSizeSelectActualIcon style={{ color: LinkedInBlue }} />
          <h4>Photo</h4>
        </label>
        <div className={classes.media__options}>
          <YouTubeIcon style={{ color: "orange" }} />
          <h4>Video</h4>
        </div>
        <div className={classes.media__options}>
          <AssignmentTurnedInIcon style={{ color: "#cea2cc" }} />
          <h4>Goal</h4>
        </div>
        <div className={classes.media__options}>
          <CalendarViewDayIcon style={{ color: "#f5987e" }} />
          <h4>Article</h4>
        </div>
      </div>
    </Paper>
  );
};

export default Form;
