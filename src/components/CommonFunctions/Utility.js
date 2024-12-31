const RowExpansionTemplate  = (data) => {
    const inputRef = useRef(null);
    
    useEffect(() => {
        if (editingCell && inputRef.current) {
            inputRef.current.focus();
        }
    }, [editingCell]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (inputRef.current && !inputRef.current.contains(event.target)) {
                setEditingCell(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const rows = groupedData[data.VendorPaymentId] || [];
    const childRows = rows.filter((row) => row.RowId !== data.RowId);

    const emptyChildRow = {
        ...data,
        PayACH: data.PayACH,
        RowId: Date.now(),
        ClassName: fieldMaps.classNameMap[data.VendorPaymentId] || '',
        GLAccount: fieldMaps.glAccountMap[data.VendorPaymentId] || '',
        InvoiceDate: fieldMaps.invoiceDateMap[data.VendorPaymentId] || '',
        Invoice: fieldMaps.invoiceMap[data.VendorPaymentId] || '',
        Memo: fieldMaps.memoMap[data.VendorPaymentId] || '',
        VendorPaymentId: data.VendorPaymentId 
    };

    const allRows = [emptyChildRow, ...childRows];

    // Helper function for editable fields
    const renderEditableField = (childRow, col) => {
        const isEditing = editingCell === `${childRow.RowId}-${col.field}`;
        const value = col.field === "TotalAmount" ? childRow.SubTotal : childRow[col.field] || "";

        if (isEditing) {
            return (
                <input
                    ref={inputRef}
                    type="text"
                    value={value}
                    onChange={(e) => {
                        const newValue = e.target.value;
                        if (col.field === "TotalAmount") {
                            childRow.SubTotal = newValue;
                        } else {
                            childRow[col.field] = newValue;
                        }
                        setLocalData([...localData]);
                    }}
                    className="text-[12px] font-normal text-black-900 clsGridInput w-full"
                    onClick={(e) => e.stopPropagation()}
                />
            );
        }

        return (
            <span
                onClick={(e) => {
                    e.stopPropagation();
                    setEditingCell(`${childRow.RowId}-${col.field}`);
                }}
                className="text-[14px] font-normal text-black-900 cursor-pointer"
            >
                {value}
            </span>
        );
    };

    return (
        <>
            {allRows.map((childRow, index) => (
                <tr key={index} className="p-row justify-between flex">
                    <div className="w-[48px] flex-shrink-0"></div>
                    {columns.map((col, colIndex) => (
                        <div
                            key={colIndex}
                            className="p-col"
                            style={{
                                ...(colIndex === 0 && { position: "relative", left: "-8px" }),
                                ...(colIndex === 1 && { position: "relative", left: "2px" }),
                                ...(colIndex === 7 && { position: "relative", left: "12px" }),
                                ...(colIndex === 8 && { position: "relative", left: "13px" }),
                                ...(colIndex === 9 && { position: "relative", left: "10px" }),
                                ...(colIndex === 10 && { position: "relative", left: "5px" }),
                                ...(col.style ? { width: col.style.width, minWidth: col.style.width } : {}),
                            }}
                        >
                            {col.field === "Payee" ? (
                                <div className="flex flex-col items-start justify-center h-full px-4">
                                    <div 
                                        className="text-[10px] font-normal text-black-900"
                                        dangerouslySetInnerHTML={{ 
                                            __html: childRow?.LastPaidDetails?.replace(/<b>/g, '').replace(/<\/b>/g, '') || '' 
                                        }}
                                    />
                                </div>
                            ) : col.field === "GLAccount" ? (
                                editingCell === `${childRow.RowId}-${col.field}` ? (
                                    <GroupSelect
                                  size="sm"
                                  shape="round"
                                  options={accounts.map(opt => ({
                                    label: `${opt.Account_Id} - ${opt.Account_Name}`,
                                    value: opt.Account_Id,
                                    Account_Id: opt.Account_Id,
                                    Account_Name: opt.Account_Name
                                  }))}
                                  name="Account"
                                  valueKey="Account_Id"
                                  labelKey="label"
                                  sessionid={sessionid}
                                  values={[{
                                    Account_Id: parseInt(childRow[col.field]?.split('-')[0]?.trim()) || 0,
                                    label: childRow[col.field] || ''
                                  }]}
                                  Account_Id={parseInt(childRow[col.field]?.split('-')[0]?.trim()) || 0}
                                  RowId={childRow.RowId}
                                  handleRemove={handleRemove}
                                  onChange={(selected) => {
                                    const selectedEntityLabel = selected[1];
                                    childRow[col.field] = `${selectedEntityLabel.value}`;
                                    setLocalData([...localData]);
                                    setEditingCell(null);
                                  }}
                                  showSearch={true}
                                  placeholder="Search GL Account"
                                  showAddPaymentSplit={false}
                                  showRemoveRow={false}
                                  style={{ 
                                    margin: 0,
                                    border: 'none'
                                  }}
                                />
                                ) : (
                                    <span
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setEditingCell(`${childRow.RowId}-${col.field}`);
                                        }}
                                        className="text-[14px] font-normal text-black-900 cursor-pointer"
                                    >
                                        {childRow[col.field] || ""}
                                    </span>
                                )
                            ) : col.field === "TotalAmount" || col.field === "ClassName" ? (
                                renderEditableField(childRow, col)
                            ) : (
                                col.body ? col.body(childRow) : childRow[col.field]
                            )}
                        </div>
                    ))}
                </tr>
            ))}
        </>
    );
};
export default RowExpansionTemplate;