import { Spinner } from "components/CommonFunctions/Accessories";
import { useState, useEffect, useRef, Fragment } from "react";

const AutoComplete = (props) => {
  const {
    label,
    onChange: iOnChange = () => {},
    value,
    placeholder,
    disabled = false,
    onBlur = () => {},
    onFocus = () => {},
    symbol = null,
    symbolPosition = "left",
    iProcessingStatus = null,
    handleSearch = () => {},
    valueKey = "value",
    labelKey = "label",
    name,
    options = [],
  } = props;

  const [searchText, setSearchText] = useState(value || "");
  const [isFocus, setIsFocus] = useState(false);
  const [elementPosition, setElementPosition] = useState({ top: 0, width: 0 });
  const [filteredOption, setFilteredOption] = useState(options || []);
  const [processingStatus, setProcessingStatus] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    setSearchText(value);
  }, [value]);

  useEffect(() => {
    if (options.length > 0) {
      setFilteredOption(options);
    }
  }, [options]);
  const onChange = (e) => {
    setIsFocus(false);
    iOnChange(e);
  };

  useEffect(() => {
    setProcessingStatus(iProcessingStatus);
  }, [iProcessingStatus]);

  useEffect(() => {
    const handler = setTimeout(async () => {
      if (
        searchText !== value &&
        searchText?.length > 2 &&
        !searchText.includes(",")
      ) {
        setProcessingStatus("searching");
        const results = await handleSearch(searchText);
        setFilteredOption(results || []);
        setProcessingStatus(null);
      }
      if (searchText === "") {
        setFilteredOption([]);
      }
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [searchText]);

  useEffect(() => {
    if (isFocus && filteredOption.length > 0) {
      setSelectedIndex(
        (filteredOption || []).findIndex((item) => item[labelKey] === value)
      );
    } else {
      setSelectedIndex(0);
    }
  }, [isFocus, filteredOption]);

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      setSelectedIndex((prev) => {
        let nextIndex = prev === null ? 0 : prev + 1;

        while (
          nextIndex < filteredOption.length &&
          filteredOption[nextIndex][valueKey] === -1
        ) {
          nextIndex++;
        }

        if (nextIndex >= filteredOption.length) {
          nextIndex = 1;
        }

        return nextIndex;
      });
    } else if (e.key === "ArrowUp") {
      setSelectedIndex((prev) => {
        let prevIndex = prev === null ? filteredOption.length - 1 : prev - 1;

        while (prevIndex >= 0 && filteredOption[prevIndex][valueKey] === -1) {
          prevIndex--;
        }

        if (prevIndex < 0) {
          prevIndex = filteredOption.length - 1;
        }

        return prevIndex;
      });
    } else if (e.key === "Enter" && selectedIndex !== null) {
      onChange({
        target: { name: name, value: filteredOption[selectedIndex] },
      });
    }
  };

  const handleClickOption = (index) => {
    onChange({ target: { name: name, value: filteredOption[index] } });
  };
  useEffect(() => {
    if (selectedIndex !== null) {
      const selectedItem = dropdownRef.current?.children[selectedIndex];
      if (selectedItem) {
        selectedItem.scrollIntoView({
          // behavior: "smooth",
          block: "center",
        });
      }
    }
  }, [selectedIndex]);
  return (
    <div>
      <span>{label || ""}</span>
      {symbolPosition === "left" && symbol}
      <input
        ref={inputRef}
        disabled={disabled}
        onChange={({ target }) => setSearchText(target.value)}
        value={searchText || ""}
        placeholder={placeholder || ""}
        className={`border border-gray-500 rounded-md ${
          disabled ? "bg-gray-300 cursor-not-allowed" : ""
        } ${symbol && symbolPosition === "left" ? "pl-8" : ""} ${
          symbol && symbolPosition === "right" ? "pr-8" : ""
        }`}
        onBlur={(e) => {
          setTimeout(() => setIsFocus(false), 300);
          onBlur(e);
        }}
        onFocus={(e) => {
          setIsFocus(true);
          const boundary = e?.currentTarget?.getBoundingClientRect();
          setElementPosition({
            top: boundary.bottom + 5,
            width: boundary.width,
          });
          onFocus(e);
        }}
        onKeyDown={handleKeyDown}
      />
      {symbolPosition === "right" && symbol}
      {processingStatus === "searching" && (
        <span className="spinner absolute right-3"></span>
      )}

      {searchText?.length > 2 && isFocus && (
        <div
          ref={dropdownRef}
          className="absolute bg-[#fff] max-h-[300px] overflow-auto border border-gray-500 rounded-md"
          style={{
            top: elementPosition.top,
            width: elementPosition.width,
            zIndex: 10,
          }}
        >
          {processingStatus === "searching" ? (
            <div className="p-3">
              <Spinner text="Searching..." size="xxs" />
            </div>
          ) : filteredOption.length > 0 ? (
            filteredOption.map((item, index) => (
              <Fragment key={index}>
                {item[valueKey] === -1 ? (
                  <div
                    key={index}
                    onClick={() => handleClickOption(index)}
                    className={`py-2 px-4 cursor-pointer text-[#478fca] bg-[#eef4f9]    `}
                  >
                    <span>{item[labelKey]}</span>
                  </div>
                ) : (
                  <div
                    key={index}
                    onClick={() => handleClickOption(index)}
                    className={`py-2 cursor-pointer px-4 cursor-pointer hover:bg-indigo-400 hover:text-[#fff] ${
                      index % 2 === 0 ? "bg-gray-100" : "bg-[#fff]"
                    } ${
                      selectedIndex === index ? "bg-indigo-400 text-[#fff]" : ""
                    }`}
                  >
                    <span>{item[labelKey]}</span>
                  </div>
                )}
              </Fragment>
            ))
          ) : (
            <div className="text-center p-4">No result found.</div>
          )}
        </div>
      )}
    </div>
  );
};

export { AutoComplete };
