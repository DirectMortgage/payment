import { Fragment, useEffect, useRef, useState } from "react";
import {
  cleanValue,
  formatCurrency,
  handleAPI,
} from  "../../components/CommonFunctions/CommonFunction.js";
//import Modal from "react-bootstrap/Modal";
//import "bootstrap/dist/css/bootstrap.min.css";

const Button = (props) => {
  const {
    text,
    onClick = () => {},
    style = {},
    type = "primary",
    disabled = false,
    autoFocus = false,
  } = props;
  const buttonRef = useRef(null);

  useEffect(() => {
    if (buttonRef.current && autoFocus) {
      buttonRef.current.focus();
    }
  }, []);
  return (
    <button
      {...props}
      disabled={disabled}
      style={style}
      onClick={onClick}
      className={`button ${type}`}
      ref={buttonRef}
    >
      {text}
    </button>
  );
};

const Input = ({
  onChange = () => {},
  value = "",
  name = "",
  onFocus = () => {},
  onBlur = () => {},
  format = null,
  id = null,
  disabled = false,
  style = {},
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const getValue = () => {
    if (format === "$") {
      value = isFocused ? (value == 0 ? "" : value) : formatCurrency(value);
    }
    return value;
  };

  return (
    <input
      type="text"
      id={id}
      className={disabled ? "input-box-disabled" : "input-box"}
      style={style}
      disabled={disabled}
      onChange={({ target }) => {
        let { value } = target;
        if (format === "$") {
          value = value
            .replace(/[^\d.]/g, "")
            .split(".")
            .slice(0, 2)
            .join(".");
        }

        onChange({ name, value });
      }}
      value={getValue()}
      onFocus={(event) => {
        setIsFocused(true);
        onFocus(event);
      }}
      onBlur={(event) => {
        setIsFocused(false);
        onBlur(event);
      }}
    ></input>
  );
};

const DropDown = ({
  onChange = () => {},
  value = "",
  name = "",
  options = [],
  keys = {},
  style = {},
  ReadOnly = 0,
}) => {
  const { label = "label", value: optionValue = "value" } = keys;
  return (
    <select
      className={ReadOnly == 1 ? "input-box-disabled" : "input-box"}
      onChange={({ target }) => {
        const { value } = target;
        onChange({
          name,
          value,
          option: options.filter((option) => option[optionValue] == value),
        });
      }}
      value={value}
      style={style}
      disabled={ReadOnly === 1}
    >
      <option value="-1">Select</option>
      {options.map((option, index) => (
        <option key={index} value={option[optionValue]}>
          {option[label]}
        </option>
      ))}
    </select>
  );
};

const InputField = ({
  label,
  onChange = () => {},
  value = "",
  name = "",
  onFocus = () => {},
  onBlur = () => {},
  format = null,
  id = null,
  placeholder = "",
  style = {},
  disabled = false,
  showValidation = false,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  value =
    format === "$" ? (cleanValue(value) == 0 ? "" : cleanValue(value)) : value;

  return (
    <div
      className={`input-field-wrapper ${
        showValidation && (value || "").length == 0 ? "in-valid" : ""
      }`}
      style={style}
    >
      <span className="input-field-label">{label || ""}</span>
      <input
        type="text"
        id={id}
        disabled={disabled}
        className="input-field"
        onChange={({ target }) => {
          let { value } = target;
          if (format === "$") {
            value = Number(
              value
                .replace(/[^\d.]/g, "")
                .split(".")
                .slice(0, 2)
                .join(".")
            );
          }

          onChange({ name, value });
        }}
        value={format === "$" && !isFocused ? formatCurrency(value) : value}
        onFocus={(event) => {
          setIsFocused(true);
          onFocus(event);
        }}
        onBlur={(event) => {
          setIsFocused(false);
          onBlur(event);
        }}
        placeholder={placeholder || label}
      ></input>
    </div>
  );
};
const InputAreaField = ({
  label,
  onChange = () => {},
  value = "",
  name = "",
  onFocus = () => {},
  onBlur = () => {},
  format = null,
  id = null,
  placeholder = "",
  style = {},
  disabled = false,
  showValidation = false,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  value =
    format === "$" ? (cleanValue(value) == 0 ? "" : cleanValue(value)) : value;

  return (
    <div
      className={`input-field-wrapper ${
        showValidation && (value || "").length == 0 ? "in-valid" : ""
      }`}
      style={style}
    >
      <span className="input-field-label">{label || ""}</span>
      <input
        type="textarea"
        id={id}
        disabled={disabled}
        className="input-field"
        onChange={({ target }) => {
          let { value } = target;
          if (format === "$") {
            value = Number(
              value
                .replace(/[^\d.]/g, "")
                .split(".")
                .slice(0, 2)
                .join(".")
            );
          }

          onChange({ name, value });
        }}
        value={format === "$" && !isFocused ? formatCurrency(value) : value}
        onFocus={(event) => {
          setIsFocused(true);
          onFocus(event);
        }}
        onBlur={(event) => {
          setIsFocused(false);
          onBlur(event);
        }}
        placeholder={placeholder || label}
      ></input>
    </div>
  );
};

const DropDownField = ({
  onChange = () => {},
  value = "",
  name = "",
  options = [],
  keys = {},
  style = {},
  label: fLabel,
}) => {
  const { label = "label", value: optionValue = "value" } = keys;
  return (
    <div className="input-field-wrapper">
      <span className="input-field-label">{fLabel || ""}</span>
      <select
        className="input-field"
        onChange={({ target }) => {
          const { value } = target;
          onChange({
            name,
            value,
            option: options.filter((option) => option[optionValue] == value),
          });
        }}
        value={value}
        style={style}
      >
        <option value="-1">Select</option>
        {options.map((option, index) => (
          <option key={index} value={option[optionValue]}>
            {option[label]}
          </option>
        ))}
      </select>{" "}
    </div>
  );
};


const DropZone = ({ children, index, onChange = () => {}, style = {} }) => {
  function dragEnter(e) {
    e.preventDefault();
    document.querySelectorAll(".drop-area.active").forEach((item) => {
      item.classList.remove("active");
    });
    document.getElementById(`dropArea-${index}`).classList.add("active");
  }

  function dragOver(e) {
    e.preventDefault();
  }

  function dragLeave(e) {
    e.preventDefault();
    setTimeout(() => {
      document.getElementById(`dropArea-${index}`)?.classList.remove("active");
    }, 1000);
  }

  function drop(e) {
    e.preventDefault();
    document.getElementById(`dropArea-${index}`).classList.remove("active");

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      onChange({ target: { files } });
    }
  }
  return (
    <>
      <div
        className="drop-area"
        id={`dropArea-${index}`}
        onDragEnter={dragEnter}
        onDragOver={dragOver}
        onDragLeave={dragLeave}
        onDrop={drop}
        style={style}
      >
        {children}
      </div>
    </>
  );
};

const FileUpload = ({
  index,
  onChange = () => {},
  text,
  style = {},
  className = "primary",
  id,
}) => {
  return (
    <Fragment key={id}>
      <input
        type="file"
        key={id}
        id={id}
        style={{ display: "none" }}
        onChange={onChange}
        accept=".pdf,.jpg,.jpeg,.png,.gif,.heic,.heif"
      />
      <label
        htmlFor={id}
        className={`button ${className}`}
        style={{
          whiteSpace: "nowrap",
          minWidth: "inherit",
          ...style,
          textAlign: "center",
          fontSize: 10,
        }}
      >
        {text}
      </label>
    </Fragment>
  );
};

// const ModalBox = ({
//   show = false,
//   header = <></>,
//   body = <></>,
//   closeLabel = "Close",
//   saveLabel = "Save",
//   handleClose = () => {},
//   handleSave = () => {},
//   disableSave = false,
//   isAlert = false,
//   closeButton = true,
//   titleMode = "text",
//   hideFooter = false,
//   footerLeftContent = null,
//   size = null,
//   headerStyle = {},
//   preventClose = false,
// }) => {
//   let top = 20;
//   try {
//     top =
//       window.top.document.querySelector("#frmTabContent").contentDocument.body
//         .scrollTop;
//   } catch (error) {}
//   return (
//     <>
//       <Modal
//         size={size}
//         show={show}
//         onHide={handleClose}
//         style={{ top }}
//         backdrop={preventClose ? "static" : "false"}
//         keyboard={false}
//       >
//         {titleMode === "text" ? (
//           <Modal.Header closeButton={closeButton} style={headerStyle}>
//             <Modal.Title>{header}</Modal.Title>
//           </Modal.Header>
//         ) : (
//           <>{header}</>
//         )}
//         <Modal.Body>{body}</Modal.Body>
//         {!hideFooter && (
//           <Modal.Footer
//             style={
//               footerLeftContent
//                 ? { display: "flex", justifyContent: "space-between" }
//                 : {}
//             }
//           >
//             {footerLeftContent && footerLeftContent}
//             {!isAlert && (
//               <Button
//                 text={closeLabel}
//                 type="secondary"
//                 onClick={handleClose}
//               />
//             )}
//             <Button
//               autoFocus
//               text={saveLabel}
//               onClick={handleSave}
//               disabled={disableSave}
//             />
//           </Modal.Footer>
//         )}
//       </Modal>
//     </>
//   );
// };
function useWindowWidth() {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return windowWidth;
}


export {
  Button,
  Input,
  DropDown,
  InputField,
  InputAreaField,
  DropDownField,
  FileUpload,
  //ModalBox,
  DropZone,
  useWindowWidth,
};