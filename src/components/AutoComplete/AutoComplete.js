import React, { useState, useEffect } from 'react';

const AutoCompleteInputBox = (props) => {
    const {
        label,
        onSelect,
        value,
        placeholder,
        options, // Add this prop
        disabled = false,
        type = "text",
        style = {},
        onBlur = () => {},
        onFocus = () => {},
        symbol = null,
        symbolPosition = "left",
        inputBoxStyle = {},
        inputBoxLabel = {},
        listIcon = <></>,
    } = props;

    const [searchText, setSearchText] = useState(value || "");
    const [isFocus, setIsFocus] = useState(false);
    const [elementPosition, setElementPosition] = useState({ top: 0, width: 0 });
    const [filteredOption, setFilteredOption] = useState([]);

   

    useEffect(() => {
        setSearchText(value);
    }, [value]);

    useEffect(() => {
        const handler = setTimeout(() => {
            if (searchText?.length > 2 && !searchText.includes(",")) {
                const filtered = options.filter(option => 
                    option.label.toLowerCase().includes(searchText.toLowerCase())
                );
                setFilteredOption(filtered);
            }
            if (searchText === "") {
                onSelect({ label: "" });
                setFilteredOption([]);
            }
        }, 500);

        return () => {
            clearTimeout(handler);
        };
    }, [searchText, options]);

    return (
        <>
            <div
                style={{
                    ...styles.inputBoxContainer,
                    ...{
                        border: `1px solid silver`,
                        marginBottom: 20,
                    },
                    ...style,
                    ...(symbol
                        ? { flexDirection: "row", display: "flex", alignItems: "center" }
                        : {}),
                }}
            >
                <span style={{ ...styles.inputBoxLabel, ...inputBoxLabel }}>
                    {label || ""}
                </span>
                {symbolPosition == "left" && symbol}
                <input
                    disabled={disabled}
                    onChange={({ target }) => {
                        let { value } = target;
                        setSearchText(value);
                    }}
                    value={searchText || ""}
                    placeholder={placeholder || ""}
                    style={{
                        ...styles.inputBox,
                        ...(disabled
                            ? { backgroundColor: "#dddddd8c", cursor: "not-allowed" }
                            : {}),
                        ...(symbol && symbolPosition == "left"
                            ? { paddingLeft: 20 }
                            : symbol && symbolPosition == "right"
                            ? { paddingRight: 20 }
                            : {}),
                        ...inputBoxStyle,
                    }}
                    onBlur={(e) => {
                        setTimeout(() => {
                            setIsFocus(false);
                        }, 300);
                        onBlur(e);
                    }}
                    onFocus={(e) => {
                        setIsFocus(true);
                        const boundary = e?.currentTarget?.getBoundingClientRect(),
                            top = boundary["bottom"] + 30,
                            width = boundary["width"];
                        setElementPosition({ top, width });
                        onFocus(e);
                    }}
                />
                {symbolPosition == "right" && symbol}
            </div>
            {searchText?.length > 2 && isFocus && (
                <>
                    <div
                        className="autoCompleteOptionWrapper"
                        style={{ width: elementPosition["width"] }}
                    >
                        {filteredOption.length > 0 ? (
                            filteredOption.map((item, index) => {
                                return (
                                    <div
                                        onClick={() => onSelect(item)}
                                        className="autoCompleteOptionList"
                                        key={index}
                                        style={{
                                            background: "white",
                                            padding: "15px",
                                            borderBottom: "1px solid #b2b2b2c0",
                                        }}
                                    >
                                        {listIcon} <span>{item.label}</span>
                                    </div>
                                );
                            })
                        ) : (
                            <div
                                className="autoCompleteOptionList"
                                key={-1}
                                style={{
                                    background: "white",
                                    padding: "15px",
                                    borderBottom: "1px solid #b2b2b2c0",
                                    textAlign: "center",
                                }}
                            >
                                <span>No result found.</span>
                            </div>
                        )}
                    </div>
                </>
            )}
        </>
    );
};
const styles = {
    inputBoxLabel: {
      position: "absolute",
      backgroundColor: "#fff",
      top: -10,
      left: 3,
      fontSize: 14,
      color: "gray",
      paddingHorizontal: 3,
      flex: 1,
      fontWeight: "bold",
    }
}

export default AutoCompleteInputBox;