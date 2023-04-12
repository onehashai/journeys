var InstaSummary, InstaBasic;
var html;
function switchtab() {
    let id = $(this).attr("id");
}
function get_details_by_cin(cin, reference_docname, rsync = false) {
    frappe.call({
        method: 'journeys.journeys.doctype.finrich_request.finrich_request.get_finrich_data',
        args: {
            "cin": cin,
            "reference_docname": reference_docname,
            "reference_doctype": "Lead",
            "rsync": rsync,
            "request_for": "Summary"
        },
        // disable the button until the request is completed
        btn: $('.primary-action'),
        freeze_message: "Please wait, retriving data",
        // freeze the screen until the request is completed
        freeze: true,
        callback: (r) => {
            if (r.message) {
                if (!r.message.request_data) {
                    msgprint("Sorry, No Record Found!. Please Try with different name.");
                    return false;
                } else {
                    let InstaSummaryResponse = (JSON.parse(r.message.request_data));
                    if (r.message.status == "Error" || (InstaSummaryResponse.Status && InstaSummaryResponse.Status == "error")) {
                        frappe.throw(InstaSummaryResponse.Type)
                        return false;
                    }
                    InstaSummary = InstaSummaryResponse["InstaSummary"];
                    getCalculatedFields();
                    html = '<div class="col-xs-12 text-right"><span>Last Updated On: ' + frappe.format(r.message.modified, { fieldtype: 'Date' }) + ' </span><button class="btn btn-xs btn-primary resync-summary" data-cin="' + cin + '" data-reference_docname="' + reference_docname + '">Update</button></div>';
                    basicInformation();
                    summaryFinancialStatements();
                    ratingsLast12Months();
                    openCharges();
                    establishment();
                    currentDirectors();
                    directorsInfoAndOtherDirectorships();
                    let d = new frappe.ui.Dialog({
                        title: InstaSummaryResponse.InstaSummary.CompanyMasterSummary.CompanyName,
                        indicator: "green",
                        fields: [
                            {
                                label: 'Search Result',
                                fieldname: 'finrich_summary',
                                fieldtype: 'HTML'
                            }
                        ]
                        /*primary_action_label:"Print",
                            primary_action(values){
                            let html = d.fields_dict.finrich_summary.$wrapper.html();
                            frappe.render_pdf(html);
                            }*/
                    });
                    d.fields_dict.finrich_summary.$wrapper.html(html);
                    d.$wrapper.find('.modal-dialog').css({ "max-width": "max-content", "margin-inline": "10rem", "font-size": "11px" });
                    d.$wrapper.find('.table').css({ "margin": "20px 0px", "border-radius": "9px", "width": "max-content", "max-width": "100%", "box-shadow": "0 0.05rem 0.2rem rgb(0 0 0 / 50%)" });
                    d.$wrapper.find('.resync-summary').off('click').on('click', function () {
                        d.hide();
                        let reference_docname = $(this).data('reference_docname');
                        let cin = $(this).data('cin');
                        get_details_by_cin(cin, reference_docname, true);

                    });
                    d.show();
                }
            }
        }
    });
}

function get_basic_details_by_cin(cin, reference_docname, rsync = false) {
    frappe.call({
        method: 'journeys.journeys.doctype.finrich_request.finrich_request.get_finrich_data',
        args: {
            "cin": cin,
            "reference_docname": reference_docname,
            "reference_doctype": "Lead",
            "rsync": rsync,
            "request_for": "Basic"
        },
        // disable the button until the request is completed
        btn: $('.primary-action'),
        freeze_message: "Please wait, retriving data",
        // freeze the screen until the request is completed
        freeze: true,
        callback: (r) => {
            if (r.message) {
                if (!r.message.request_data) {
                    msgprint("Sorry, No Record Found!. Please Try with different name.");
                    return false;
                } else {
                    try {
                        let InstaSummaryResponse = (JSON.parse(r.message.request_data));
                        if (r.message.status == "Error" || (InstaSummaryResponse.Status && InstaSummaryResponse.Status == "error")) {
                            frappe.throw(InstaSummaryResponse.Type)
                            return false;
                        }
                        InstaBasic = InstaSummaryResponse["InstaBasic"];
                        getCalculatedFieldsBasic();
                        html = "";
                        basicInformationBasic();
                        summaryFinancialStatementsBasic();
                        ratingsLast12MonthsBasic();
                        openChargesBasic();
                        establishmentBasic();
                        currentDirectorsBasic();
                        directorsInfoAndOtherDirectorshipsBasic();
                        let d = new frappe.ui.Dialog({
                            title: InstaSummaryResponse.InstaBasic.CompanyMasterSummary.CompanyName,
                            indicator: "green",
                            fields: [
                                {
                                    label: 'Search Result',
                                    fieldname: 'finrich_basic',
                                    fieldtype: 'HTML'
                                }
                            ]
                            /*primary_action_label:"Print",
                                primary_action(values){
                                let html = d.fields_dict.finrich_summary.$wrapper.html();
                                frappe.render_pdf(html);
                                }*/
                        });
                        d.fields_dict.finrich_basic.$wrapper.html(html);
                        d.$wrapper.find('.modal-dialog').css({ "max-width": "max-content", "margin-inline": "10rem", "font-size": "11px" });
                        d.$wrapper.find('.table').css({ "margin": "20px 0px", "border-radius": "9px", "width": "max-content", "max-width": "100%", "box-shadow": "0 0.05rem 0.2rem rgb(0 0 0 / 50%)" });
                        d.show();
                    } catch (error) {
                    }

                }
            }
        }
    });
}

var InstaSummaryResponse = {}, InstaBasicReponse = {};

function generateTableByFieldSchema(schema, fieldData) {
    let section_html = '<h2>' + schema.section_title + '</h2>';
    let subsections = schema.subsections;
    $.each(subsections, function (key, section_config) {
        let section_header = '<h4>' + section_config.section_header + '</h4>';
        let section_data_layout = (section_config.data_layout) ? section_config.data_layout : "key_value";
        let section_table;
        switch (section_data_layout) {
            case "key_value":
                section_table = createLayoutKeyValuePair(section_config, fieldData);
                break;
            case "static_grid":
                section_table = createStaticGridLayout(section_config, fieldData);
                break;
            case "dynamic_grid":
                section_table = createGridLayout(section_config, fieldData);
                break;
            default:
                section_table = createLayoutKeyValuePair(section_config, fieldData);
                break;
        }
        section_html += (section_header + section_table);
    });
    return section_html;
}

function createGridLayout(section_config, fieldData) {
    let section_table = '<table class="table table-bordered table-striped table-responsive">';
    if (section_config.data_key) {
        fieldData = fieldData[section_config.data_key];
    }
    let fixed_column_label = section_config.column_label;
    let column_key = section_config.column;
    let data_object = groupDataByKeys(fieldData, column_key);
    let attributes = section_config.attributes;
    section_table += "<tr><th>" + fixed_column_label + "</th>";
    $.each(data_object.keys, (key, value) => {
        section_table += '<th>' + value + '</th>';
    });
    section_table += "</tr>";
    $.each(attributes, (label, field_config) => {
        section_table += "<tr><th>" + label + "</th>";
        $.each(data_object.keys, (key, value) => {
            let formattedValue = data_object["data"][value][field_config["data_key"]];
            if (field_config.formatter) {
                formattedValue = getFormattedValue(formattedValue, field_config.formatter, field_config.formatter_option);
            } else if (formattedValue == "null") {
                formattedValue = "-";
            }
            section_table += '<td>' + formattedValue + '</td>';
        });
        section_table += '</tr>';
    });
    section_table += '</table>';
    return section_table;
}

function createStaticGridLayout(section_config, fieldData) {
    let section_table = '<table class="table table-bordered table-striped table-responsive">';
    let attributes = section_config.attributes;
    let keys = Object.keys(attributes);
    if (section_config.data_key) {
        fieldData = fieldData[section_config.data_key];
    }
    section_table += "<tr>";
    $.each(keys, (key, value) => {
        section_table += '<th>' + value + '</th>';
    });
    section_table += "</tr>";
    $.each(fieldData, (index, data_row) => {
        $.each(attributes, (key, field_config) => {
            let formattedValue = data_row[field_config["data_key"]];
            if (field_config.formatter) {
                formattedValue = getFormattedValue(formattedValue, field_config.formatter, field_config.formatter_option);
            } else if (formattedValue == "null") {
                formattedValue = "-"
            }

            section_table += '<td>' + formattedValue + '</td>';
        });
        section_table += '</tr>';
    });
    section_table += '</table>';
    return section_table;
}

function groupDataByKeys(dataObject, key_by) {
    let formattedObject = {};
    let keys_array = [];
    $.each(dataObject, (key, value) => {
        keys_array.push(value[key_by]);
        formattedObject[value[key_by]] = value;
    });
    return { "keys": keys_array, "data": formattedObject };
}
function createLayoutKeyValuePair(section_config, fieldData) {
    var section_table = '<table class="table table-bordered table-striped table-responsive">';
    let attribute_index = 0;
    let attribute_count = section_config['attributes'].length
    if (section_config.data_key) {
        fieldData = fieldData[section_config.data_key];
    }
    let label_column_width = (section_config['column_style'] && section_config['column_style'][0]) ? section_config['column_style'][0] : "auto";
    let data_column_width = (section_config['column_style'] && section_config['column_style'][1]) ? section_config['column_style'][1] : "auto";

    $.each(section_config['attributes'], function (field_label, field_config) {
        if (attribute_index % 2 == 0) {
            section_table += '<tr>'
        }
        let formattedValue = fieldData[field_config['data_key']];
        if (field_config.formatter) {
            formattedValue = getFormattedValue(formattedValue, field_config.formatter, field_config.formatter_option);
        } else if (formattedValue == "null") {
            formattedValue = "-"
        }
        section_table += '<th style="width:' + label_column_width + ';">' + field_label + '</th><td style="width:' + data_column_width + ';">' + formattedValue + '</td>';
        attribute_index++;
        if (attribute_index % 2 == 0) {
            section_table += '</tr>';
        }
        if (attribute_index % 2 == 1 && attribute_index == attribute_count) {
            section_table += '<td>&nbsp;</td><td>&nbsp;</td></tr>';
        }
    });
    section_table += '</table>';
    return section_table;
}

function getFormattedValue(value, type, formatter_option = {}) {
    switch (type) {
        case 'currency':
            return formatCurrency(value, formatter_option)
            break;
        case 'emailLink':
            return (value && value != "null") ? ('<a href="mailto:' + value + '">' + value + '</a>') : "-";
            break;
        case 'webLink':
            return (value && value != "null") ? ('<a href="' + value + '" target="_blank">' + value + '</a>') : "-";
            break;
        case 'pdfLink':
            return (value && value != "null") ? ('<a href="' + value + '" target="_blank">Click Here</a>') : "-";
            break;
    }
}

function getCalculatedFields() {
    try {
        InstaSummary["CompanyMasterSummary"]["Age"] = calculateAge();
        InstaSummary["CompanyMasterSummary"]["Directors"] = `Current: ${InstaSummary["DirectorSignatoryMasterSummary"]["DirectorCurrentDirectorshipMasterSummary"]["Director"].length} Directors ${typeof InstaSummary["DirectorSignatoryMasterSummary"]["DirectorPastDirectorshipMasterSummary"] !== 'undefined' ? `(Past: ${InstaSummary["DirectorSignatoryMasterSummary"]["DirectorPastDirectorshipMasterSummary"]["Director"].length} Directors)` : ''}`;
        InstaSummary["CompanyMasterSummary"]["OpenCharges"] = calculateOpenCharges();
        let signatoryCount = (typeof InstaSummary.DirectorSignatoryMasterSummary !== "undefined" && typeof InstaSummary.DirectorSignatoryMasterSummary.SignatoryCurrentMasterSummary !== "undefined" && typeof InstaSummary.DirectorSignatoryMasterSummary.SignatoryCurrentMasterSummary.Signatory !== 'undefined') ? (Array.isArray(InstaSummary["DirectorSignatoryMasterSummary"]["SignatoryCurrentMasterSummary"]["Signatory"]) ? InstaSummary["DirectorSignatoryMasterSummary"]["SignatoryCurrentMasterSummary"]["Signatory"].length : 1) : 0;

        InstaSummary["CompanyMasterSummary"]["Signatories"] = (signatoryCount == 0) ? "-" : ((signatoryCount > 1) ? signatoryCount + " Signatory" : signatoryCount + " Signatories");
        InstaSummary["CompanyMasterSummary"]["ProfitAfterTax"] = formatCurrency(InstaSummary["FinancialsSummary"]["FinancialsYearWise"][0]["ProfitAfterTax"])
        InstaSummary["CompanyMasterSummary"]["EmployeesAndLocations"] = getEmployeeCountAndLocations();
    } catch (e) {
    }
    return InstaSummary;
}

function getEmployeeCountAndLocations() {
    let employees = (typeof InstaSummary.EmployeeAndEstablishmentSummary !== 'undefined' && typeof InstaSummary.EmployeeAndEstablishmentSummary.EmployeeTrend !== 'undefined' && typeof InstaSummary.EmployeeAndEstablishmentSummary.EmployeeTrend.EmployeeMonthWise !== 'undefined') ? InstaSummary["EmployeeAndEstablishmentSummary"]["EmployeeTrend"]["EmployeeMonthWise"][0]["EpfEmployeeCountTotal"] : "NA";
    let locations = (typeof InstaSummary.EmployeeAndEstablishmentSummary !== 'undefined' && typeof InstaSummary.EmployeeAndEstablishmentSummary.EstablishmentMaster !== 'undefined' && typeof InstaSummary.EmployeeAndEstablishmentSummary.EstablishmentMaster.Establishment !== 'undefined') ? InstaSummary["EmployeeAndEstablishmentSummary"]["EstablishmentMaster"]["Establishment"].length : "NA";
    let outputString = "";
    if (employees != "NA" && locations != "NA") {
        outputString = `${employees > 0 ? `${employees} employee${employees > 1 ? 's' : ''}` : ''}${employees > 0 && locations > 0 ? ' & ' : ''}${locations > 0 ? `${locations} Location${locations > 1 ? 's' : ''}` : ''}`;
    } else if (employees != "NA") {
        outputString = employees + " employees";
    } else if (locations != "NA") {
        outputString = locations + " Locations";
    }
    return outputString;
}

function calculateOpenCharges() {
    let openCharges = (typeof InstaSummary.ChargesMasterSummary !== 'undefined' && typeof InstaSummary.ChargesMasterSummary.OpenChargesMasterSummary !== 'undefined' && typeof InstaSummary['ChargesMasterSummary']["OpenChargesMasterSummary"]["Charge"] !== "undefined") ? (InstaSummary["ChargesMasterSummary"]["OpenChargesMasterSummary"]["Charge"]) : [];
    let openChargeCount = openCharges.length;
    let openChargeValue = 0;
    $.each(openCharges, function (key, chargeObject) {
        openChargeValue += Number(chargeObject["ChargeAmount"]);
    });
    let formattedString = (openChargeValue) ? formatCurrency(openChargeValue) + " ( " + openChargeCount + " Charges )" : "0 Charges";
    return formattedString;
}

function getDateDiffInYear(dateString, endDate = "", precision = 0) {
    let today = new Date();
    if (endDate !== "") {
        let endYear = endDate.substring(6, 10);
        let endMonth = endDate.substring(3, 5);
        let endDay = endDate.substring(0, 2);
        today = new Date(endYear, endMonth, endDay);
    }
    let currentYear = today.getFullYear();
    let currentMonth = today.getMonth();
    let incorporationYear = dateString.substring(6, 10);
    let incorporationMonth = dateString.substring(3, 5);
    let incorporationDay = dateString.substring(0, 2);
    let dateStringObject = new Date(incorporationYear, incorporationMonth, incorporationDay);
    let diffTime = Math.abs(dateStringObject - today);
    let diffYear;
    if (precision) {
        diffYear = (diffTime / (1000 * 60 * 60 * 24 * 365)).toFixed(precision);
    } else {
        diffYear = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 365));
    }
    return diffYear;
}
function calculateAge(dateString = "") {
    if (dateString == "") {
        dateString = InstaSummary["CompanyMasterSummary"]["CompanyDateOfInc"];
    }
    let diffYear = getDateDiffInYear(dateString);
    return (diffYear) + " Years (" + dateString + ")";
}

function formatCurrency(amount, options = {}) {
    let symbol;
    let formattedAmount;
    let number;
    let preFormatted = (options.preFormatted) ? true : false;
    if (((amount.toString()).split(".")[0]).length >= 10) {
        formattedAmount = (amount / 10000000).toFixed(2);
        symbol = "Cr";
    } else {
        formattedAmount = (amount / 100000).toFixed(2);
        symbol = "Lakhs";
    }
    if (preFormatted) {
        formattedAmount = amount;
        symbol = (preFormatted.symbol) ? preFormatted.symbol : "";
    }
    if (isNaN(Number(formattedAmount))) {
        return "-";
    }
    formattedAmount = Number(formattedAmount).toLocaleString('en-IN', {
        maximumFractionDigits: 2,
        style: 'currency',
        currency: 'INR'
    });
    return formattedAmount + " " + symbol;
}

function basicInformation() {
    let basicData = (InstaSummary.CompanyMasterSummary) ? InstaSummary['CompanyMasterSummary'] : [];
    if (basicData.length == 0) {
        return false;
    }
    let schema = {
        "section_title": "Company Highlights",
        "subsections": [{
            "section_header": "Basic Information",
            "column": 2,
            "column_style": [20, 30],
            "data_layout": "key_value",
            "attributes": {
                "Age (Incorp. Date)": { "data_key": "Age" },
                "BalanceSheet Date": { "data_key": "CompanyLastBsDate" },
                "Company Status": { "data_key": "CompanyMcaStatus" },
                "Paid up Capital": { "data_key": "CompanyPaidUpCapital", "formatter": "currency" },
                "Company Type": { "data_key": "CompanyClass" },
                "Profit After Tax": { "data_key": "ProfitAfterTax" },
                "Company SubCategory": { "data_key": "CompanySubCategory" },
                "Open Charges": { "data_key": "OpenCharges" },
                "Email ID": { "data_key": "CompanyEmail", "formatter": "emailLink" },
                "Directors": { "data_key": "Directors" },
                "Company Website": { "data_key": "CompanyWebSite", "formatter": "webLink" },
                "Number of Signatories": { "data_key": "Signatories" },
                "Industry": { "data_key": "CompanyMcaIndustry" },
                "Company Address": { "data_key": "CompanyFullAddress" }
            }
        },
        {
            "section_header": "KYC Information",
            "column": 2,
            "column_style": [20, 30],
            "data_layout": "key_value",
            "attributes": {
                "Company Pan": { "data_key": "CompanyPan" },
                "Employees & Locations": { "data_key": "EmployeesAndLocations" }
            }
        }
        ]
    };

    html += generateTableByFieldSchema(schema, basicData);
}


function summaryFinancialStatements() {
    let basicData = (typeof InstaSummary.FinancialsSummary !== 'undefined' && typeof InstaSummary.FinancialsSummary.FinancialsYearWise !== 'undefined') ? InstaSummary['FinancialsSummary']["FinancialsYearWise"] : [];
    if (basicData.length == 0) {
        return false;
    }
    let schema = {
        "section_title": "Summary Financial Statements",
        "subsections": [{
            "section_header": "",
            "column": "FinancialYear",
            "column_label": "Financial Element",
            "data_layout": "dynamic_grid",
            "attributes": {
                "Total Income": { "data_key": "TotalIncome", "formatter": "currency", "formatter_option": { "Amount In": "Lakhs" } },
                "Total Expense": { "data_key": "TotalExpense", "formatter": "currency", "formatter_option": { "Amount In": "Lakhs" } },
                "Profit Before Tax (PBT)": { "data_key": "ProfitBeforeTax", "formatter": "currency", "formatter_option": { "Amount In": "Lakhs" } },
                "Income Tax": { "data_key": "IncomeTax", "formatter": "currency", "formatter_option": { "Amount In": "Lakhs" } },
                "Profit After Tax (PAT)": { "data_key": "ProfitAfterTax", "formatter": "currency", "formatter_option": { "Amount In": "Lakhs" } }
            }
        }
        ]
    };
    html += generateTableByFieldSchema(schema, basicData);
}

function ratingsLast12Months() {
    let basicData = (typeof InstaSummary.CreditRatingDetail !== 'undefined' && typeof InstaSummary.CreditRatingDetail.CreditRating !== 'undefined') ? InstaSummary["CreditRatingDetail"]["CreditRating"] : [];
    if (basicData.length == 0) {
        return false;
    }
    let schemaLast12Month = {
        "section_title": "Credit Ratings & Defaults",
        "subsections": [{
            "section_header": "Ratings-Last 12 Months",
            "data_layout": "static_grid",
            "attributes": {
                "Agency": { "data_key": "RatingAgency" },
                "Rating Date": { "data_key": "RatingAssignedDate" },
                "Type": { "data_key": "RatingPeriod" },
                "Instrument": { "data_key": "RatingInstrumentName" },
                "Amount": { "data_key": "RatingInstrumentwiseAmount", "formatter": "currency", "formatter_option": { "Amount In": "Lakhs", "preFormatted": 0, "symbol_column": "RatingCurrency" } },
                "Rating": { "data_key": "RatingAssigned" },
                "Rational": { "data_key": "RatingPdfUrl", "formatter": "pdfLink" }
            }
        }]
    };
    let schemaMoreThan12Month = {
        "section_title": "",
        "subsections": [{
            "section_header": "Ratings-More than 12 Months",
            "data_layout": "static_grid",
            "attributes": {
                "Agency": { "data_key": "RatingAgency" },
                "Rating Date": { "data_key": "RatingAssignedDate" },
                "Type": { "data_key": "RatingPeriod" },
                "Instrument": { "data_key": "RatingInstrumentName" },
                "Amount": { "data_key": "RatingInstrumentwiseAmount", "formatter": "currency", "formatter_option": { "Amount In": "Lakhs", "preFormatted": 0, "symbol_column": "RatingCurrency" } },
                "Rating": { "data_key": "RatingAssigned" },
                "Rational": { "data_key": "RatingPdfUrl", "formatter": "pdfLink" }
            }
        }
        ]
    };
    let last12MonthRating = [];
    let moreThan12MonthRating = [];
    $.each(basicData, (key, value) => {
        switch (value.RatingRoundingoff) {
            case "Million":
                value.RatingInstrumentwiseAmount = (value.RatingInstrumentwiseAmount) * 1000000;
                break;
            case "Crore":
                value.RatingInstrumentwiseAmount = (value.RatingInstrumentwiseAmount) * 10000000;
                break;
            case "Lakhs":
                value.RatingInstrumentwiseAmount = (value.RatingInstrumentwiseAmount) * 100000;
                break;
            default:
                break;
        }
        if (value.RatingAssignedDate && value.RatingAssignedDate.length == 10) {
            let diffInYear = getDateDiffInYear(value.RatingAssignedDate)
            if (diffInYear) {
                moreThan12MonthRating.push(value);
            } else {
                last12MonthRating.push(value);
            }
        }
    });
    if (last12MonthRating.length > 0) {
        html += generateTableByFieldSchema(schemaLast12Month, last12MonthRating);
    }
    if (moreThan12MonthRating.length > 0) {
        html += generateTableByFieldSchema(schemaMoreThan12Month, moreThan12MonthRating);
    }
}

function suitFiledCases() {

}
function openCharges() {
    let basicData = (typeof InstaSummary.ChargesMasterSummary !== 'undefined' && typeof InstaSummary.ChargesMasterSummary.OpenChargesMasterSummary != 'undefined' && typeof InstaSummary.ChargesMasterSummary.OpenChargesMasterSummary.Charge !== 'undefined') ? InstaSummary["ChargesMasterSummary"]["OpenChargesMasterSummary"]["Charge"] : [];
    if (basicData.length == 0) {
        return false
    }
    let schema = {
        "section_title": "Company Charges",
        "subsections": [{
            "section_header": "Open Charges",
            "data_layout": "static_grid",
            "data_key": "OpenCharges",
            "attributes": {
                "Charge Holder": { "data_key": "ChargeHolderName" },
                "Charge Amount": { "data_key": "ChargeAmount", "formatter": "currency", "formatter_option": { "Amount In": "Lakhs", "preFormatted": 0, "symbol_column": "RatingCurrency" } },
                "Creation Date": { "data_key": "ChargeDateOfCreation" }
            }
        },
        {
            "section_header": "Bank-Wise Open Charges",
            "data_layout": "static_grid",
            "data_key": "BankWiseOpenCharges",
            "attributes": {
                "Charge Holder": { "data_key": "ChargeHolderName" },
                "Charge Amount": { "data_key": "ChargeAmount", "formatter": "currency", "formatter_option": { "Amount In": "Lakhs", "preFormatted": 0, "symbol_column": "RatingCurrency" } }
            }
        },
        {
            "section_header": "Satisfied Charges",
            "data_layout": "static_grid",
            "data_key": "SatisfiedCharges",
            "attributes": {
                "Charge Holder": { "data_key": "ChargeHolderName" },
                "Amount": { "data_key": "ChargeAmount", "formatter": "currency", "formatter_option": { "Amount In": "Lakhs", "preFormatted": 0, "symbol_column": "RatingCurrency" } },
                "Outstanding Years": { "data_key": "OutstandingYears" },
                "Creation Date": { "data_key": "ChargeDateOfCreation" },
                "Satisfaction Date": { "data_key": "ChargeDateOfSatisfaction" }
            }
        }
        ]
    };

    let BankWiseOpenCharges = {};
    $.each(basicData, (key, value) => {
        if (BankWiseOpenCharges[value.ChargeHolderName]) {
            BankWiseOpenCharges[value.ChargeHolderName]["ChargeAmount"] += Number(value.ChargeAmount);
        } else {
            BankWiseOpenCharges[value.ChargeHolderName] = { "ChargeHolderName": value.ChargeHolderName, "ChargeAmount": Number(value.ChargeAmount) };
        }
    });
    let SatisfiedCharges = (typeof InstaSummary.ChargesMasterSummary !== 'undefined' && typeof InstaSummary.ChargesMasterSummary.SatisfiedChargesMasterSummary !== 'undefined' && typeof InstaSummary.ChargesMasterSummary.SatisfiedChargesMasterSummary.Charge !== 'undefined') ? InstaSummary["ChargesMasterSummary"]["SatisfiedChargesMasterSummary"]["Charge"] : [];
    $.each(SatisfiedCharges, (key, value) => {
        SatisfiedCharges[key]["OutstandingYears"] = getDateDiffInYear(value.ChargeDateOfCreation, value.ChargeDateOfSatisfaction, 2) + " Years";
    });
    let formattedData = { "SatisfiedCharges": SatisfiedCharges, "BankWiseOpenCharges": BankWiseOpenCharges, "OpenCharges": basicData };
    if (SatisfiedCharges.length == 0) {
        schema.subsections.splice(3, 1);
    }
    html += generateTableByFieldSchema(schema, formattedData);
}

function establishment() {
    let establishmentData = (typeof InstaSummary.EmployeeAndEstablishmentSummary !== 'undefined' && typeof InstaSummary.EmployeeAndEstablishmentSummary.EstablishmentMaster !== 'undefined' && typeof InstaSummary.EmployeeAndEstablishmentSummary.EstablishmentMaster.Establishment !== 'undefined') ? InstaSummary["EmployeeAndEstablishmentSummary"]["EstablishmentMaster"]["Establishment"] : [];
    let employeesTrendsData = (typeof InstaSummary.EmployeeAndEstablishmentSummary !== 'undefined' && typeof InstaSummary.EmployeeAndEstablishmentSummary.EmployeeTrend !== 'undefined' && typeof InstaSummary.EmployeeAndEstablishmentSummary.EstablishmentMaster.EmployeeMonthWise !== 'undefined') ? InstaSummary["EmployeeAndEstablishmentSummary"]["EmployeeTrend"]["EmployeeMonthWise"] : [];
    let schema = {
        "section_title": "Establishment & Employees",
        "subsections": [{
            "section_header": "Establishment",
            "data_layout": "static_grid",
            "data_key": "Establishment",
            "attributes": {
                "Unit Name": { "data_key": "EstablishmentName" },
                "City": { "data_key": "EPFCity" },
                "Pincode": { "data_key": "EstablishmentCode" }
            }
        },
        {
            "section_header": "Employees Trend",
            "data_layout": "static_grid",
            "data_key": "EmployeeTrend",
            "attributes": {
                "Month Year": { "data_key": "WagesMonth" },
                "No of Employees": { "data_key": "EpfEmployeeCountTotal" },
                "EPF Amount Paid": { "data_key": "EpfAmountPaidTotal", "formatter": 'currency' }
            }
        }
        ]
    };

    let formattedData = { "Establishment": establishmentData, "EmployeeTrend": employeesTrendsData };
    if (establishmentData.length == 0 && employeesTrendsData.length == 0) {
        return false;
    }
    if (employeesTrendsData.length == 0) {
        schema.subsections.splice(2, 1)
    }
    if (establishmentData.length == 0) {
        schema.subsections.splice(1, 1)
    }

    html += generateTableByFieldSchema(schema, formattedData);
}

function currentDirectors() {
    let currentDirectors = (typeof InstaSummary.DirectorSignatoryMasterSummary !== 'undefined' && typeof InstaSummary.DirectorSignatoryMasterSummary.DirectorCurrentMasterSummary !== 'undefined' && typeof InstaSummary.DirectorSignatoryMasterSummary.DirectorCurrentMasterSummary.Director !== 'undefined') ? InstaSummary["DirectorSignatoryMasterSummary"]["DirectorCurrentMasterSummary"]["Director"] : [];
    let pastDirectors = (typeof InstaSummary.DirectorSignatoryMasterSummary !== 'undefined' && typeof InstaSummary.DirectorSignatoryMasterSummary.DirectorPastMasterSummary !== 'undefined' && typeof InstaSummary.DirectorSignatoryMasterSummary.DirectorPastMasterSummary.Director !== 'undefined') ? InstaSummary["DirectorSignatoryMasterSummary"]["DirectorPastMasterSummary"]["Director"] : [];
    let schema = {
        "section_title": "Company Directors and Potential Related Party",
        "subsections": [{
            "section_header": "Current Directors",
            "data_layout": "static_grid",
            "data_key": "CurrentDirectors",
            "attributes": {
                "Company Directors": { "data_key": "DirectorName" },
                "Director DIN": { "data_key": "DirectorDin" },
                "Designation": { "data_key": "DirectorDesignation" },
                "Appointment Date": { "data_key": "DirectorDateOfAppnt" }
            }
        },
        {
            "section_header": "Past Directors",
            "data_layout": "static_grid",
            "data_key": "PastDirectors",
            "attributes": {
                "Company Directors": { "data_key": "DirectorName" },
                "Director DIN": { "data_key": "DirectorDin" },
                "Designation": { "data_key": "DirectorDesignation" },
                "Appointment Date": { "data_key": "DirectorDateOfAppnt" },
                "Cessation Date": { "data_key": "DirectorDateOfCessation" }
            }
        },
        {
            "section_header": "Potential Related Party",
            "data_layout": "static_grid",
            "data_key": "PotentialRelatedParty",
            "attributes": {
                "Company Name": { "data_key": "CompanyName" },
                "PaidUp Capital": { "data_key": "CompanyPaidUpCapital", "formatter": "currency" },
                "Industry": { "data_key": "CompanyMcaIndustry" },
                "Age": { "data_key": "CompanyAge" },
                "Directors Count": { "data_key": "CommonDirectorCount" }
            }
        }
        ]
    };
    let potentialRelatedParty = (typeof InstaSummary.DirectorSignatoryMasterSummary !== 'undefined' && typeof InstaSummary.DirectorSignatoryMasterSummary.PotentialRelatedPartyMasterSummary !== "undefined" && typeof InstaSummary.DirectorSignatoryMasterSummary.PotentialRelatedPartyMasterSummary.RelatedParty !== "undefined") ? InstaSummary["DirectorSignatoryMasterSummary"]["PotentialRelatedPartyMasterSummary"]["RelatedParty"] : [];
    $.each(potentialRelatedParty, (key, value) => {
        value["CompanyAge"] = getDateDiffInYear(value.CompanyDateOfInc) + " Years";
        potentialRelatedParty[key] = value;
    });
    if (potentialRelatedParty.length == 0) {
        schema.subsections.splice(3, 1)
    }
    if (pastDirectors.length == 0) {
        schema.subsections.splice(2, 1)
    }
    if (currentDirectors.length == 0) {
        schema.subsections.splice(1, 1)
    }
    if (schema.subsections.length == 0) {
        return false;
    }
    let formattedData = { "CurrentDirectors": currentDirectors, "PastDirectors": pastDirectors, "PotentialRelatedParty": potentialRelatedParty };
    html += generateTableByFieldSchema(schema, formattedData);
}

function directorsInfoAndOtherDirectorships() {
    let currentDirectors = (typeof InstaSummary.DirectorSignatoryMasterSummary !== 'undefined' && typeof InstaSummary.DirectorSignatoryMasterSummary.DirectorCurrentMasterSummary !== 'undefined' && typeof InstaSummary.DirectorSignatoryMasterSummary.DirectorCurrentMasterSummary.Director !== 'undefined') ? InstaSummary["DirectorSignatoryMasterSummary"]["DirectorCurrentMasterSummary"]["Director"] : [];
    if (currentDirectors.length == 0) {
        return false;
    }
    let schema = {
        "section_title": "Company Directors and Potential Related Part",
        "subsections": []
    };
    let formattedData = {};
    $.each(currentDirectors, (index, directorCurrentMasterSummary) => {
        directorCurrentMasterSummary.DirectorAge = calculateAge(directorCurrentMasterSummary.DirectorDateOfBirth);
        let otherDirectorships = InstaSummary["DirectorSignatoryMasterSummary"]["DirectorCurrentDirectorshipMasterSummary"]["Director"][index]["CompanyOtherDirecorship"];
        if (typeof otherDirectorships !== "undefined" && !Array.isArray(otherDirectorships)) {
            otherDirectorships = [otherDirectorships];
        }
        $.each(otherDirectorships, (key, value) => {
            value.CompanyAge = calculateAge(value.CompanyDateOfInc);
            otherDirectorships.key = value;
        });

        formattedData[directorCurrentMasterSummary.DirectorDin + "_summary"] = directorCurrentMasterSummary;
        formattedData[directorCurrentMasterSummary.DirectorDin + "_directorship"] = otherDirectorships;

        let summary_section_schema = {
            "section_header": directorCurrentMasterSummary.DirectorName + " - ( DIN : " + directorCurrentMasterSummary.DirectorDin + ")",
            "data_layout": "key_value",
            "data_key": directorCurrentMasterSummary.DirectorDin + "_summary",
            "attributes": {
                "Age": { "data_key": "DirectorAge" },
                "No. of Directorship": { "data_key": "DirectorCurrentDirectorshipCount" },
                "PAN Number": { "data_key": "DirectorPANNumber" },
                "Total Capitalization": { "data_key": "DirectorCapitalization" },
                "Email": { "data_key": "DirectorEmail" },
                "Avg. Capitalization": { "data_key": "DirectorAvgCapitalization" },
                "Designation": { "data_key": "DirectorDesignation" },
                "Address": { "data_key": "DirectorPresentAddress" },
                "Nationality": { "data_key": "DirectorNationality" }
            }
        };
        schema["subsections"].push(summary_section_schema);

        let other_directorship_section_schema = {
            "section_header": "",
            "data_layout": "static_grid",
            "data_key": directorCurrentMasterSummary.DirectorDin + "_directorship",
            "attributes": {
                "Current Company": { "data_key": "CompanyName" },
                "Industry": { "data_key": "CompanyMcaIndustry" },
                "Company Age": { "data_key": "CompanyAge" },
                "Common Directors": { "data_key": "CommonDirectorCount" }
            }
        };
        schema["subsections"].push(other_directorship_section_schema);

    });
    html += generateTableByFieldSchema(schema, formattedData);
}

/** Basic Insta Summary */
function getCalculatedFieldsBasic() {
    InstaBasic["CompanyMasterSummary"]["Age"] = calculateAge(InstaBasic.CompanyMasterSummary.CompanyDateOfInc);
    let curerntDirectorCount = (typeof InstaBasic.DirectorSignatoryMasterBasic !== "undefined" && typeof InstaBasic.DirectorSignatoryMasterBasic.Director !== "undefined") ? InstaBasic["DirectorSignatoryMasterBasic"]["DirectorCurrentMasterBasic"]["Director"].length : 0;
    let pastDirectorCount = (typeof InstaBasic.DirectorSignatoryMasterBasic !== "undefined" && typeof InstaBasic.DirectorSignatoryMasterBasic.Director !== "undefined") ? InstaBasic["DirectorSignatoryMasterBasic"]["DirectorPastMasterBasic"]["Director"].length : 0;
    InstaBasic["CompanyMasterSummary"]["Directors"] = "Current: " + curerntDirectorCount + " Directors (Past: " + pastDirectorCount + " Directors)";
    InstaBasic["CompanyMasterSummary"]["OpenCharges"] = calculateOpenChargesBasic();
    let signatoryCount = ((typeof InstaBasic.DirectorSignatoryMasterBasic !== 'undefined') && (typeof InstaBasic.DirectorSignatoryMasterBasic.SignatoryCurrentMasterBasic !== 'undefined') && (typeof InstaBasic.DirectorSignatoryMasterBasic.SignatoryCurrentMasterBasic.Signatory !== 'undefined')) ? (InstaBasic["DirectorSignatoryMasterBasic"]["SignatoryCurrentMasterBasic"]["Signatory"].length) : 0;
    InstaBasic["CompanyMasterSummary"]["Signatories"] = (signatoryCount > 1) ? signatoryCount + " Signatory" : signatoryCount + " Signatories";
    return InstaBasic;
}

function calculateOpenChargesBasic() {
    let openCharges = (typeof InstaBasic.ChargesMasterSummary !== 'undefined' && typeof InstaBasic.ChargesMasterSummary.OpenChargesMasterSummary !== 'undefined' && typeof InstaBasic['ChargesMasterSummary']["OpenChargesMasterSummary"]["Charge"] !== "undefined") ? (InstaBasic["ChargesMasterSummary"]["OpenChargesMasterSummary"]["Charge"]) : [];
    let openChargeCount = openCharges.length;
    let openChargeValue = 0;
    $.each(openCharges, function (key, chargeObject) {
        openChargeValue += Number(chargeObject["ChargeAmount"]);
    });
    let formattedString = (openChargeValue) ? formatCurrency(openChargeValue) + " ( " + openChargeCount + " Charges )" : "0 Charges";
    return formattedString;
}

function basicInformationBasic() {
    let basicData = (InstaBasic.CompanyMasterSummary) ? InstaBasic['CompanyMasterSummary'] : [];
    if (basicData.length == 0) {
        return false;
    }
    let schema = {
        "section_title": "Company Highlights",
        "subsections": [{
            "section_header": "Basic Information",
            "column": 2,
            "column_style": [20, 30],
            "data_layout": "key_value",
            "attributes": {
                "Age (Incorp. Date)": { "data_key": "Age" },
                "BalanceSheet Date": { "data_key": "CompanyLastBsDate" },
                "Company Status": { "data_key": "CompanyMcaStatus" },
                "Paid up Capital": { "data_key": "CompanyPaidUpCapital", "formatter": "currency" },
                "Company Type": { "data_key": "CompanyClass" },
                "Company SubCategory": { "data_key": "CompanySubCategory" },
                "Open Charges": { "data_key": "OpenCharges" },
                "Email ID": { "data_key": "CompanyEmail", "formatter": "emailLink" },
                "Directors": { "data_key": "Directors" },
                "Company Website": { "data_key": "CompanyWebSite", "formatter": "webLink" },
                "Number of Signatories": { "data_key": "Signatories" },
                "Industry": { "data_key": "CompanyMcaIndustry" },
                "Company Address": { "data_key": "CompanyFullAddress" }
            }
        }]
    };

    html += generateTableByFieldSchema(schema, basicData);
}


function summaryFinancialStatementsBasic() {
    let basicData = (typeof InstaBasic.FinancialsBasic !== 'undefined' && typeof InstaBasic.FinancialsBasic.FinancialsYearWise !== 'undefined') ? InstaBasic['FinancialsBasic']["FinancialsYearWise"] : [];
    if (basicData.length == 0) {
        return false;
    }
    let schema = {
        "section_title": "Basic Financial Statements",
        "subsections": [{
            "section_header": "",
            "column": "FinancialYear",
            "column_label": "Financial Element",
            "data_layout": "dynamic_grid",
            "attributes": {
                "Total Income": { "data_key": "TotalIncome", "formatter": "currency", "formatter_option": { "Amount In": "Lakhs" } },
                "Total Expense": { "data_key": "TotalExpense", "formatter": "currency", "formatter_option": { "Amount In": "Lakhs" } },
                "Profit Before Tax (PBT)": { "data_key": "ProfitBeforeTax", "formatter": "currency", "formatter_option": { "Amount In": "Lakhs" } },
                "Income Tax": { "data_key": "IncomeTax", "formatter": "currency", "formatter_option": { "Amount In": "Lakhs" } },
                "Profit After Tax (PAT)": { "data_key": "ProfitAfterTax", "formatter": "currency", "formatter_option": { "Amount In": "Lakhs" } }
            }
        }
        ]
    };
    html += generateTableByFieldSchema(schema, basicData);
}

function ratingsLast12MonthsBasic() {
    let basicData = (typeof InstaBasic.CreditRatingDetail !== 'undefined' && typeof InstaBasic.CreditRatingDetail.CreditRating !== 'undefined') ? InstaBasic["CreditRatingDetail"]["CreditRating"] : [];
    if (basicData.length == 0) {
        return false;
    }
    let schemaLast12Month = {
        "section_title": "Credit Ratings & Defaults",
        "subsections": [{
            "section_header": "Ratings-Last 12 Months",
            "data_layout": "static_grid",
            "attributes": {
                "Agency": { "data_key": "RatingAgency" },
                "Rating Date": { "data_key": "RatingAssignedDate" },
                "Type": { "data_key": "RatingPeriod" },
                "Instrument": { "data_key": "RatingInstrumentName" },
                "Amount": { "data_key": "RatingInstrumentwiseAmount", "formatter": "currency", "formatter_option": { "Amount In": "Lakhs", "preFormatted": 0, "symbol_column": "RatingCurrency" } },
                "Rating": { "data_key": "RatingAssigned" },
                "Rational": { "data_key": "RatingPdfUrl", "formatter": "pdfLink" }
            }
        }]
    };
    let schemaMoreThan12Month = {
        "section_title": "",
        "subsections": [{
            "section_header": "Ratings-More than 12 Months",
            "data_layout": "static_grid",
            "attributes": {
                "Agency": { "data_key": "RatingAgency" },
                "Rating Date": { "data_key": "RatingAssignedDate" },
                "Type": { "data_key": "RatingPeriod" },
                "Instrument": { "data_key": "RatingInstrumentName" },
                "Amount": { "data_key": "RatingInstrumentwiseAmount", "formatter": "currency", "formatter_option": { "Amount In": "Lakhs", "preFormatted": 0, "symbol_column": "RatingCurrency" } },
                "Rating": { "data_key": "RatingAssigned" },
                "Rational": { "data_key": "RatingPdfUrl", "formatter": "pdfLink" }
            }
        }
        ]
    };
    let last12MonthRating = [];
    let moreThan12MonthRating = [];
    $.each(basicData, (key, value) => {
        switch (value.RatingRoundingoff) {
            case "Million":
                value.RatingInstrumentwiseAmount = (value.RatingInstrumentwiseAmount) * 1000000;
                break;
            case "Crore":
                value.RatingInstrumentwiseAmount = (value.RatingInstrumentwiseAmount) * 10000000;
                break;
            case "Lakhs":
                value.RatingInstrumentwiseAmount = (value.RatingInstrumentwiseAmount) * 100000;
                break;
            default:
                break;
        }
        if (value.RatingAssignedDate && value.RatingAssignedDate.length == 10) {
            let diffInYear = getDateDiffInYear(value.RatingAssignedDate)
            if (diffInYear) {
                moreThan12MonthRating.push(value);
            } else {
                last12MonthRating.push(value);
            }
        }
    });
    if (last12MonthRating.length > 0) {
        html += generateTableByFieldSchema(schemaLast12Month, last12MonthRating);
    }
    if (moreThan12MonthRating.length > 0) {
        html += generateTableByFieldSchema(schemaMoreThan12Month, moreThan12MonthRating);
    }
}

function openChargesBasic() {
    let basicData = (typeof InstaBasic.ChargesMasterBasic !== 'undefined' && typeof InstaBasic.ChargesMasterBasic.OpenChargesMasterBasic != 'undefined' && typeof InstaBasic.ChargesMasterBasic.OpenChargesMasterBasic.Charge !== 'undefined') ? InstaBasic["ChargesMasterBasic"]["OpenChargesMasterBasic"]["Charge"] : [];
    if (basicData.length == 0) {
        return false
    }
    let schema = {
        "section_title": "Company Charges",
        "subsections": [{
            "section_header": "Open Charges",
            "data_layout": "static_grid",
            "data_key": "OpenCharges",
            "attributes": {
                "Charge Holder": { "data_key": "ChargeHolderName" },
                "Charge Amount": { "data_key": "ChargeAmount", "formatter": "currency", "formatter_option": { "Amount In": "Lakhs", "preFormatted": 0, "symbol_column": "RatingCurrency" } },
                "Creation Date": { "data_key": "ChargeDateOfCreation" }
            }
        },
        {
            "section_header": "Bank-Wise Open Charges",
            "data_layout": "static_grid",
            "data_key": "BankWiseOpenCharges",
            "attributes": {
                "Charge Holder": { "data_key": "ChargeHolderName" },
                "Charge Amount": { "data_key": "ChargeAmount", "formatter": "currency", "formatter_option": { "Amount In": "Lakhs", "preFormatted": 0, "symbol_column": "RatingCurrency" } }
            }
        },
        {
            "section_header": "Satisfied Charges",
            "data_layout": "static_grid",
            "data_key": "SatisfiedCharges",
            "attributes": {
                "Charge Holder": { "data_key": "ChargeHolderName" },
                "Amount": { "data_key": "ChargeAmount", "formatter": "currency", "formatter_option": { "Amount In": "Lakhs", "preFormatted": 0, "symbol_column": "RatingCurrency" } },
                "Outstanding Years": { "data_key": "OutstandingYears" },
                "Creation Date": { "data_key": "ChargeDateOfCreation" },
                "Satisfaction Date": { "data_key": "ChargeDateOfSatisfaction" }
            }
        }
        ]
    };

    let BankWiseOpenCharges = {};
    $.each(basicData, (key, value) => {
        if (BankWiseOpenCharges[value.ChargeHolderName]) {
            BankWiseOpenCharges[value.ChargeHolderName]["ChargeAmount"] += Number(value.ChargeAmount);
        } else {
            BankWiseOpenCharges[value.ChargeHolderName] = { "ChargeHolderName": value.ChargeHolderName, "ChargeAmount": Number(value.ChargeAmount) };
        }
    });
    let SatisfiedCharges = (typeof InstaBasic.ChargesMasterBasic !== 'undefined' && typeof InstaBasic.ChargesMasterBasic.SatisfiedChargesMasterBasic !== 'undefined' && typeof InstaBasic.ChargesMasterBasic.SatisfiedChargesMasterBasic.Charge !== 'undefined') ? InstaBasic["ChargesMasterBasic"]["SatisfiedChargesMasterBasic"]["Charge"] : [];
    $.each(SatisfiedCharges, (key, value) => {
        SatisfiedCharges[key]["OutstandingYears"] = getDateDiffInYear(value.ChargeDateOfCreation, value.ChargeDateOfSatisfaction, 2) + " Years";
    });
    let formattedData = { "SatisfiedCharges": SatisfiedCharges, "BankWiseOpenCharges": BankWiseOpenCharges, "OpenCharges": basicData };
    if (SatisfiedCharges.length == 0) {
        schema.subsections.splice(3, 1);
    }
    html += generateTableByFieldSchema(schema, formattedData);
}

function establishmentBasic() {
    let establishmentData = (typeof InstaBasic.EmployeeAndEstablishmentBasic !== 'undefined' && typeof InstaBasic.EmployeeAndEstablishmentBasic.EstablishmentMaster !== 'undefined' && typeof InstaBasic.EmployeeAndEstablishmentBasic.EstablishmentMaster.Establishment !== 'undefined') ? InstaBasic["EmployeeAndEstablishmentBasic"]["EstablishmentMaster"]["Establishment"] : [];
    let employeesTrendsData = (typeof InstaBasic.EmployeeAndEstablishmentBasic !== 'undefined' && typeof InstaBasic.EmployeeAndEstablishmentBasic.EmployeeTrend !== 'undefined' && typeof InstaBasic.EmployeeAndEstablishmentBasic.EstablishmentMaster.EmployeeMonthWise !== 'undefined') ? InstaBasic["EmployeeAndEstablishmentBasic"]["EmployeeTrend"]["EmployeeMonthWise"] : [];
    let schema = {
        "section_title": "Establishment & Employees",
        "subsections": [{
            "section_header": "Establishment",
            "data_layout": "static_grid",
            "data_key": "Establishment",
            "attributes": {
                "Unit Name": { "data_key": "EstablishmentName" },
                "City": { "data_key": "EPFCity" },
                "Pincode": { "data_key": "EstablishmentCode" }
            }
        },
        {
            "section_header": "Employees Trend",
            "data_layout": "static_grid",
            "data_key": "EmployeeTrend",
            "attributes": {
                "Month Year": { "data_key": "WagesMonth" },
                "No of Employees": { "data_key": "EpfEmployeeCountTotal" },
                "EPF Amount Paid": { "data_key": "EpfAmountPaidTotal", "formatter": 'currency' }
            }
        }
        ]
    };

    let formattedData = { "Establishment": establishmentData, "EmployeeTrend": employeesTrendsData };
    if (establishmentData.length == 0 && employeesTrendsData.length == 0) {
        return false;
    }
    if (employeesTrendsData.length == 0) {
        schema.subsections.splice(2, 1)
    }
    if (establishmentData.length == 0) {
        schema.subsections.splice(1, 1)
    }

    html += generateTableByFieldSchema(schema, formattedData);
}

function currentDirectorsBasic() {
    let currentDirectors = (typeof InstaBasic.DirectorSignatoryMasterBasic !== 'undefined' && typeof InstaBasic.DirectorSignatoryMasterBasic.DirectorCurrentMasterBasic !== 'undefined' && typeof InstaBasic.DirectorSignatoryMasterBasic.DirectorCurrentMasterBasic.Director !== 'undefined') ? InstaBasic["DirectorSignatoryMasterBasic"]["DirectorCurrentMasterBasic"]["Director"] : [];
    let pastDirectors = (typeof InstaBasic.DirectorSignatoryMasterBasic !== 'undefined' && typeof InstaBasic.DirectorSignatoryMasterBasic.DirectorPastMasterBasic !== 'undefined' && typeof InstaBasic.DirectorSignatoryMasterBasic.DirectorPastMasterBasic.Director !== 'undefined') ? InstaBasic["DirectorSignatoryMasterBasic"]["DirectorPastMasterBasic"]["Director"] : [];
    let schema = {
        "section_title": "Company Directors and Potential Related Party",
        "subsections": [{
            "section_header": "Current Directors",
            "data_layout": "static_grid",
            "data_key": "CurrentDirectors",
            "attributes": {
                "Company Directors": { "data_key": "DirectorName" },
                "Director DIN": { "data_key": "DirectorDin" },
                "Designation": { "data_key": "DirectorDesignation" },
                "Appointment Date": { "data_key": "DirectorDateOfAppnt" }
            }
        },
        {
            "section_header": "Past Directors",
            "data_layout": "static_grid",
            "data_key": "PastDirectors",
            "attributes": {
                "Company Directors": { "data_key": "DirectorName" },
                "Director DIN": { "data_key": "DirectorDin" },
                "Designation": { "data_key": "DirectorDesignation" },
                "Appointment Date": { "data_key": "DirectorDateOfAppnt" }
            }
        },
        {
            "section_header": "Potential Related Party",
            "data_layout": "static_grid",
            "data_key": "PotentialRelatedParty",
            "attributes": {
                "Company Name": { "data_key": "CompanyName" },
                "PaidUp Capital": { "data_key": "CompanyPaidUpCapital", "formatter": "currency" },
                "Industry": { "data_key": "CompanyMcaIndustry" },
                "Age": { "data_key": "CompanyAge" }
            }
        }
        ]
    };
    let potentialRelatedParty = (typeof InstaBasic.DirectorSignatoryMasterBasic !== 'undefined' && typeof InstaBasic.DirectorSignatoryMasterBasic.PotentialRelatedPartyMasterBasic !== "undefined" && typeof InstaBasic.DirectorSignatoryMasterBasic.PotentialRelatedPartyMasterBasic.RelatedParty !== "undefined") ? InstaBasic["DirectorSignatoryMasterBasic"]["PotentialRelatedPartyMasterBasic"]["RelatedParty"] : [];
    $.each(potentialRelatedParty, (key, value) => {
        value["CompanyAge"] = getDateDiffInYear(value.CompanyDateOfInc) + " Years";
        potentialRelatedParty[key] = value;
    });
    if (potentialRelatedParty.length == 0) {
        schema.subsections.splice(3, 1)
    }
    if (pastDirectors.length == 0) {
        schema.subsections.splice(2, 1)
    }
    if (currentDirectors.length == 0) {
        schema.subsections.splice(1, 1)
    }
    if (schema.subsections.length == 0) {
        return false;
    }
    let formattedData = { "CurrentDirectors": currentDirectors, "PastDirectors": pastDirectors, "PotentialRelatedParty": potentialRelatedParty };
    html += generateTableByFieldSchema(schema, formattedData);
}

function directorsInfoAndOtherDirectorshipsBasic() {
    let currentDirectors = (typeof InstaBasic.DirectorSignatoryMasterBasic !== 'undefined' && typeof InstaBasic.DirectorSignatoryMasterBasic.DirectorCurrentMasterBasic !== 'undefined' && typeof InstaBasic.DirectorSignatoryMasterBasic.DirectorCurrentMasterBasic.Director !== 'undefined') ? InstaBasic["DirectorSignatoryMasterBasic"]["DirectorCurrentMasterBasic"]["Director"] : [];
    if (currentDirectors.length == 0) {
        return false;
    }
    let schema = {
        "section_title": "Directors Info and Other Directorships",
        "subsections": []
    };
    let formattedData = {};
    $.each(currentDirectors, (index, directorCurrentMasterBasic) => {
        let otherDirectorships = InstaBasic["DirectorSignatoryMasterBasic"]["DirectorAllDirectorshipMasterBasic"]["Director"][index]["Directorship"];
        if (typeof otherDirectorships !== "undefined" && !Array.isArray(otherDirectorships)) {
            otherDirectorships = [otherDirectorships];
        }
        $.each(otherDirectorships, (key, value) => {
            value.CompanyAge = calculateAge(value.CompanyDateOfInc);
            otherDirectorships.key = value;
        });

        formattedData[directorCurrentMasterBasic.DirectorDin + "_summary"] = directorCurrentMasterBasic;
        formattedData[directorCurrentMasterBasic.DirectorDin + "_directorship"] = otherDirectorships;

        let summary_section_schema = {
            "section_header": directorCurrentMasterBasic.DirectorName + " - ( DIN : " + directorCurrentMasterBasic.DirectorDin + ")",
            "data_layout": "key_value",
            "data_key": directorCurrentMasterBasic.DirectorDin + "_summary",
            "attributes": {
                "Designation": { "data_key": "DirectorDesignation" },
                "Appointment Date": { "data_key": "DirectorDateOfAppnt" }
            }
        };
        schema["subsections"].push(summary_section_schema);

        let other_directorship_section_schema = {
            "section_header": "",
            "data_layout": "static_grid",
            "data_key": directorCurrentMasterBasic.DirectorDin + "_directorship",
            "attributes": {
                "Current Company": { "data_key": "CompanyName" },
                "Industry": { "data_key": "CompanyMcaIndustry" },
                "Company Age": { "data_key": "CompanyAge" },
                "Paid Up Capital": { "data_key": "CompanyPaidUpCapital", "formatter": "currency" }
            }
        };
        schema["subsections"].push(other_directorship_section_schema);

    });
    html += generateTableByFieldSchema(schema, formattedData);
}

var make_digital_footprint = function (digital_data) {
    digital_data = JSON.parse(digital_data.request_data);
    digital_data = JSON.parse(digital_data);
    var digital_original_html = "<!doctype html>\
        <html>\
        <head>\
        <meta charset='utf-8'>\
        <meta name='viewport' content='width=device-width, initial-scale=1'>\
        <style>\
        .footprint-info table td {\
            border:none !important;\
        }\
        </style>\
        <link rel='stylesheet' href='https://use.fontawesome.com/releases/v5.15.3/css/all.css' integrity='sha384-SZXxX4whJ79/gErwcOYf+zWLeJdY/qpuqC4cAa9rOGUstPomtqpuNWT9wdPEn2fk' crossorigin='anonymous'>\
        </head>\
        <body>\
        <div class=' row final_html'>\
        <div class='col-3'>\
        <nav>\
        <div class='nav nav-pills nav-fill flex-column' id='nav-tab' role='tablist' id='nav-tabContent'>\
          {{persontab}}\
        </div>\
        </nav>\
        </div>\
        <div class='col-9'>\
        <div class='tab-content'>\
        {{main_html}}\
        </div>\
        </div>\
        </div>\
        </body>\
        </html>\
        ";

    if (digital_data['@http_status_code'] == 200 && digital_data['@persons_count'] > 0) {
        var persons_count = digital_data['@persons_count'];
        var tab_id = "person_id";
        var tab_html = "";
        var main_html = "";
        var activetab = "";

        for (var i = 0; i < persons_count; i++) {
            var tab_id = "person_id" + i;

            let person_name = "";
            let person_dob = "";
            let person_gender = "";
            let person_lang = "";
            let person_field = "";

            let person_job_display_sidebar = "NA";
            let person_image = '';
            let person_job = "";
            let person_address = "";
            let person_phones = "";
            let person_education = "";
            let person_relationships = "";
            if ("person" in digital_data) {
                person_field = "person";
                if ("names" in digital_data[person_field]) {
                    person_name = digital_data[person_field].names[0].display;
                } else {
                    person_name = "NA";
                }

                if ("dob" in digital_data[person_field]) {
                    if (typeof (digital_data[person_field].dob) !== "undefined") {
                        person_dob = digital_data[person_field].dob.display;
                    } else {
                        person_dob = digital_data[person_field].dob.display;
                    }

                } else {
                    person_dob = "NA"
                }

                if ("gender" in digital_data[person_field]) {
                    if (typeof (digital_data[person_field].gender) !== "undefined") {
                        person_gender = digital_data[person_field].gender.content;
                        person_gender = person_gender.toLowerCase().replace(/\b[a-z]/g, function (letter) {
                            return letter.toUpperCase();
                        });
                    } else {
                        person_gender = digital_data[person_field].gender.content;
                        person_gender = person_gender.toLowerCase().replace(/\b[a-z]/g, function (letter) {
                            return letter.toUpperCase();
                        });

                    }

                } else {
                    person_gender = "NA"
                }

                if ("languages" in digital_data[person_field]) {
                    person_lang = Array.prototype.map.call(digital_data[person_field].languages, function (item) {
                        return item.display;
                    }).join(",");
                } else {
                    person_lang = "NA"
                }


                if ("jobs" in digital_data[person_field]) {
                    let len = (digital_data[person_field].jobs.length)
                    for (let j = 0; j < len; j++) {
                        if (j == 0) {
                            person_job_display_sidebar = digital_data[person_field].jobs[j].display;
                        } else {

                        }
                        let person_job_title = digital_data[person_field].jobs[j].title;
                        let person_job_org = digital_data[person_field].jobs[j].organization;
                        let person_job_display = digital_data[person_field].jobs[j].display;
                        person_job = person_job + "<div class='col-sm-10'>\
                                            <p style='margin-bottom:0px;'>\
                                                <i class='fas fa-user-tie'></i>\
                                                <span align='center' style='width:50%; font-size:unset;'>\
                                                    " + person_job_title + "\
                                                </span>\
                                            </p>\
                                            <p>\
                                                <span style='font-size:12px; width:50%; display:inline; text-align:center; line-height:14px; color:#8d99a6'>\
                                                    " + person_job_org + "\
                                                </span>\
                                            </p>\
                                            <p style='font-size:12px; line-height:14px; color:#8d99a6'>\
                                                " + person_job_display + "\
                                            </p>\
                                            <hr style='margin-top: 0px;'>\
                                        </div>";
                    }
                } else {
                    person_job = "NA"
                }


                if ("addresses" in digital_data[person_field]) {
                    let len = (digital_data[person_field].addresses.length)
                    for (let j = 0; j < len; j++) {
                        let person_addr_display = digital_data[person_field].addresses[j].display;
                        person_address = person_address + "<div class='col-sm-10'>\
                                            <i class='fas fa-map-marker-alt'></i>\
                                            <p style='font-size:12px; text-align:start; line-height:14px; color:#8d99a6; display:inline;'>\
                                                " + person_addr_display + "\
                                            </p>\
                                            <hr style='margin-top: 0px;'>\
                                        </div>";
                    }
                } else {
                    person_address = "NA"
                }


                if ("phones" in digital_data[person_field]) {
                    let len = (digital_data[person_field].phones.length)
                    for (let j = 0; j < len; j++) {
                        let person_phones_display = digital_data[person_field].phones[j].display_international;
                        person_phones = person_phones + "<div class='col-sm-12'>\
                                            <i class='fas fa-phone-alt'></i>\
                                            <p style='font-size:12px; text-align:center; line-height:14px; color:#8d99a6; display:inline;'>\
                                                " + person_phones_display + "\
                                            </p>\
                                            <hr style='margin-top: 0px;'>\
                                        </div>";
                    }
                } else {
                    person_phones = "NA"
                }


                if ("educations" in digital_data[person_field]) {
                    let len = (digital_data[person_field].educations.length)
                    for (let j = 0; j < len; j++) {
                        let person_education_display = digital_data[person_field].educations[j].display;
                        person_education = person_education + "<div class='col-sm-12'>\
                                            <i class='fas fa-graduation-cap'></i>\
                                            <p style='font-size:12px; text-align:center; line-height:14px; color:#8d99a6; display:inline;'>\
                                                " + person_education_display + "\
                                            </p>\
                                            <hr style='margin-top: 0px;'>\
                                        </div>";
                    }
                } else {
                    person_education = "NA"
                }


                if ("relationships" in digital_data[person_field]) {
                    let len = (digital_data[person_field].relationships.length)
                    for (let j = 0; j < len; j++) {
                        let person_relationships_display = digital_data[person_field].relationships[j].names[0].display;
                        person_relationships = person_relationships + "<div class='col-sm-12'>\
                                            <i class='fas fa-user-friends'></i>\
                                            <p style='font-size:12px; display:inline; line-height:14px; color:#8d99a6'>\
                                                " + person_relationships_display + "\
                                            </p>\
                                            <hr style='margin-top: 0px;'>\
                                        </div>";
                    }
                } else {
                    person_relationships = "NA"
                }

                if ("images" in digital_data[person_field]) {
                    let len = (digital_data[person_field].images.length)
                    for (let j = 0; j < len; j++) {
                        let imageUrl = digital_data[person_field].images[j].url;
                        var http = $.ajax({
                            type: "HEAD",
                            url: imageUrl,
                            async: false
                        })
                        if (http.status == 200 || http.status == 0) {
                            person_image = '<img itemprop="image" class="img-responsive img-thumbnail sidebar-image" style="width:100%; border-radius:9px;" src="' + imageUrl + '">';
                            break;
                        }


                    }
                }

            } else if ("possible_persons" in digital_data) {
                person_field = "possible_persons"
                if ("names" in digital_data[person_field][i]) {
                    person_name = digital_data[person_field][i].names[0].display;
                } else {
                    person_name = "NA"
                }

                if ("dob" in digital_data[person_field][i]) {
                    if (typeof (digital_data[person_field][i].dob) !== "undefined") {
                        person_dob = digital_data[person_field][i].dob.display;
                    } else {
                        person_dob = digital_data[person_field][i].dob.display;
                    }

                } else {
                    person_dob = "NA"
                }

                if ("gender" in digital_data["possible_persons"][i]) {
                    if (typeof (digital_data["possible_persons"][i].gender) !== "undefined") {
                        person_gender = digital_data["possible_persons"][i].gender.content;
                        person_gender = person_gender.toLowerCase().replace(/\b[a-z]/g, function (letter) {
                            return letter.toUpperCase();
                        });
                    } else {
                        person_gender = digital_data["possible_persons"][i].gender.content;
                        person_gender = person_gender.toLowerCase().replace(/\b[a-z]/g, function (letter) {
                            return letter.toUpperCase();
                        });

                    }

                } else {
                    person_gender = "NA"
                }
                if ("languages" in digital_data["possible_persons"][i]) {
                    person_lang = Array.prototype.map.call(digital_data["possible_persons"][i].languages, function (item) {
                        return item.display;
                    }).join(",");
                } else {
                    person_lang = "NA"
                }


                if ("jobs" in digital_data["possible_persons"][i]) {
                    let len = (digital_data["possible_persons"][i].jobs.length)
                    for (let j = 0; j < len; j++) {
                        if (j == 0) {
                            person_job_display_sidebar = digital_data["possible_persons"][i].jobs[j].display;
                        } else {

                        }
                        let person_job_title = typeof digital_data["possible_persons"][i].jobs[j].title !== 'undefined' ? digital_data["possible_persons"][i].jobs[j].title : '';
                        let person_job_org = typeof digital_data["possible_persons"][i].jobs[j].organization !== 'undefined' ? digital_data["possible_persons"][i].jobs[j].organization : '';
                        let person_job_display = typeof digital_data["possible_persons"][i].jobs[j].display !== 'undefined' ? digital_data["possible_persons"][i].jobs[j].display : '';
                        person_job = person_job + "<div class='col-sm-10'>\
                                            <p style='margin-bottom:0px;'>\
                                                <i class='fas fa-user-tie'></i>\
                                                <span align='center' style='width:50%; font-size:unset;'>\
                                                    " + person_job_title + "\
                                                </span>\
                                            </p>\
                                            <p>\
                                                <span style='font-size:12px; width:50%; display:inline; text-align:center; line-height:14px; color:#8d99a6'>\
                                                    " + person_job_org + "\
                                                </span>\
                                            </p>\
                                            <p style='font-size:12px; line-height:14px; color:#8d99a6'>\
                                                " + person_job_display + "\
                                            </p>\
                                            <hr style='margin-top: 0px;'>\
                                        </div>";
                    }
                } else {
                    person_job = "NA"
                }

                if ("addresses" in digital_data["possible_persons"][i]) {
                    let len = (digital_data["possible_persons"][i].addresses.length)
                    for (let j = 0; j < len; j++) {
                        let person_addr_display = digital_data["possible_persons"][i].addresses[j].display;
                        person_address = person_address + "<div class='col-sm-10'>\
                                            <i class='fas fa-map-marker-alt'></i>\
                                            <p style='font-size:12px; text-align:start; line-height:14px; color:#8d99a6; display:inline;'>\
                                                " + person_addr_display + "\
                                            </p>\
                                            <hr style='margin-top: 0px;'>\
                                        </div>";
                    }
                } else {
                    person_address = "NA"
                }

                if ("phones" in digital_data["possible_persons"][i]) {
                    let len = (digital_data["possible_persons"][i].phones.length)
                    for (let j = 0; j < len; j++) {
                        let person_phones_display = digital_data["possible_persons"][i].phones[j].display_international;
                        person_phones = person_phones + "<div class='col-sm-12'>\
                                            <i class='fas fa-phone-alt'></i>\
                                            <p style='font-size:12px; text-align:center; line-height:14px; color:#8d99a6; display:inline;'>\
                                                " + person_phones_display + "\
                                            </p>\
                                            <hr style='margin-top: 0px;'>\
                                        </div>";
                    }
                } else {
                    person_phones = "NA"
                }

                if ("educations" in digital_data["possible_persons"][i]) {
                    let len = (digital_data["possible_persons"][i].educations.length)
                    for (let j = 0; j < len; j++) {
                        let person_education_display = digital_data["possible_persons"][i].educations[j].display;
                        person_education = person_education + "<div class='col-sm-12'>\
                                            <i class='fas fa-graduation-cap'></i>\
                                            <p style='font-size:12px; text-align:center; line-height:14px; color:#8d99a6; display:inline;'>\
                                                " + person_education_display + "\
                                            </p>\
                                            <hr style='margin-top: 0px;'>\
                                        </div>";
                    }
                } else {
                    person_education = "NA"
                }

                if ("relationships" in digital_data["possible_persons"][i]) {
                    let len = (digital_data["possible_persons"][i].relationships.length)
                    for (let j = 0; j < len; j++) {
                        let person_relationships_display = digital_data["possible_persons"][i].relationships[j].names[0].display;
                        person_relationships = person_relationships + "<div class='col-sm-12'>\
                                            <i class='fas fa-user-friends'></i>\
                                            <p style='font-size:12px; display:inline; line-height:14px; color:#8d99a6'>\
                                                " + person_relationships_display + "\
                                            </p>\
                                            <hr style='margin-top: 0px;'>\
                                        </div>";
                    }
                } else {
                    person_relationships = "NA"
                }


                if ("images" in digital_data["possible_persons"][i]) {
                    let len = (digital_data["possible_persons"][i].images.length)
                    for (let j = 0; j < len; j++) {
                        let imageUrl = digital_data["possible_persons"][i].images[j].url;
                        var http = $.ajax({
                            type: "HEAD",
                            url: imageUrl,
                            async: false
                        })
                        if (http.status == 200 || http.status == 0) {
                            person_image = '<img itemprop="image" class="img-responsive img-thumbnail sidebar-image" style="width:100%; border-radius:9px" src="' + imageUrl + '">';
                            break;
                        }


                    }
                }

            }

            if (i == 0) {
                tab_html = tab_html + '<a class="nav-item nav-link active" id="' + tab_id + '-tab" data-toggle="tab" role="tab" >' + person_name + '</a>';
                activetab = "active show"
            } else {
                tab_html = tab_html + '<a class="nav-item nav-link" id="' + tab_id + '-tab" data-toggle="tab" role="tab" >' + person_name + '</a>';
                activetab = ""
            }
            main_html = main_html +
                `<div class="tab-pane fade ${activetab} " id="${tab_id}" role="tabpanel">
                <div class='row' style='padding-top:20px; margin-right:15px; border: 1px solid #8d99a6; border-radius: 12px; box-shadow: 0 0.05rem 0.2rem rgb(0 0 0 / 50%);'>
                    <div class='col-sm-12'>
                        <h5>
                            <i class="fas fa-address-card"></i> PROFESSIONAL DETAILS
                        </h5>
                        <hr style='margin-top: 0px;'>
                        <div class="row">
                            ${person_image !== "" ? `<div class="col-4" style='margin-bottom: 5px;'>
                                <div class='profile-image' style="margin-bottom:8px">
                                    ${person_image}
                                </div>
                            </div>`: ''}
                            <div class="col-8" style='margin-bottom: 5px;'>
                            <p style='padding-top:10px; font-size:12px;'><i class="fas fa-user-tie"></i> ${person_name !== 'NA' ? person_name : '-'} ${person_dob !== 'NA' ? `(${person_dob})` : ''}</p>
                            ${person_job_display_sidebar !== 'NA' ? `<p style='font-size:12px;'><i class="fas fa-briefcase"></i> ${person_job_display_sidebar}</p>` : ''}
                            ${person_gender !== 'NA' ? `<p style='font-size:12px; color:#8d99a6;'>Gender: ${person_gender}</p>` : ''}
                            ${person_lang !== 'NA' ? `<p style='padding-bottom:10px; font-size:12px; color:#8d99a6;'>Languages: ${person_lang}</p>` : ''}
                            </div>
                        </div>
                    </div>
                    <div class='col-sm-8' style='margin-bottom: 5px;'>
                        <h5>
                            <i class="fas fa-map-marked-alt"></i> ADDRESS
                        </h5>
                        <hr style='margin-top: 0px;'>
                        <div class='row'>
                            ${person_address !== "NA" ? `<div class='col-sm-12'>
                                                        ${person_address}
                                                    </div>`: ''}
                        </div>
                    </div>
                    <div class='col-sm-4' style='margin-bottom: 5px;'>
                        <h5>
                            <i class="fas fa-address-book"></i> PHONES
                        </h5>
                        <hr style='margin-top: 0px;'>
                        <div class='row'>
                            ${person_phones !== "NA" ? `<div class='col-sm-12'>
                                                        ${person_phones}
                                                    </div>`: ''}
                        </div>
                    </div>
                    <div class='col-sm-7' style='margin-bottom: 5px;'>
                        <h5>
                            <i class="fas fa-building"></i> EXPERIENCE
                        </h5>
                        <hr style='margin-top: 0px;'>
                        <div class='row'>
                            ${person_job !== "NA" ? `<div class='col-sm-12'>
                                                        ${person_job}
                                                    </div>`: ''}
                        </div>
                    </div>
                    <div class='col-sm-5'>
                        <div class="row">
                            <div class='col-sm-12' style='margin-bottom: 5px;'>
                                <h5>
                                    <i class="fas fa-user-graduate"></i> EDUCATION
                                </h5>
                                <hr style='margin-top: 0px;'>
                                <div class='row'>
                                    ${person_education !== "NA" ? `<div class='col-sm-12'>
                                                                ${person_education}
                                                            </div>`: ''}
                                </div>
                            </div>
                            <div class='col-sm-12' style='margin-bottom: 5px;'>
                                <h5>
                                    <i class="fas fa-users"></i> CONNECTIONS
                                </h5>
                                <hr style='margin-top: 0px;'>
                                <div class='row'>
                                    ${person_relationships !== "NA" ? `<div class='col-sm-12'>
                                                                    ${person_relationships}
                                                                </div>`: ''}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;

        }

        digital_original_html = digital_original_html.replace("{{persontab}}", tab_html);

        digital_original_html = digital_original_html.replace("{{main_html}}", main_html);
        return digital_original_html;
    } else {
        digital_original_html = "Sorry, We couldn't retrieve any public data linked with this lead email.";
        return digital_original_html;
    }
}

frappe.ui.form.on('Lead', {
    refresh: function (frm) {
        let doc = frappe.db.get_doc('FinRich Settings');
        doc.then((finRichSettings) => {
            if (finRichSettings && !finRichSettings.enable_finrich) {
                return false;
            }
            frm.add_custom_button(__('FinRich Plus'), function () {
                let search_string;
                if (frm.doc.cin) {
                    get_details_by_cin(frm.doc.cin, frm.doc.name);
                    return
                }
                frappe.prompt([
                    {
                        label: 'Organisation Name',
                        fieldname: 'company_name',
                        fieldtype: 'Data',
                        default: frm.doc.company_name
                    }
                ], (values) => {
                    search_string = values.company_name;
                    frappe.call({
                        method: 'journeys.journeys.doctype.finrich_request.finrich_request.get_cin_by_name',
                        args: {
                            company_name: search_string
                        },
                        btn: $('.primary-action'),
                        freeze_message: "<h4>Please wait, retriving data</h4>",
                        freeze: true,
                        callback: (r) => {
                            if (r.message) {
                                if (r.message.Response == null) {
                                    msgprint("Sorry, No Record Found!. Please Try with different name.");
                                    return false;
                                } else {
                                    if (r.message.Response.Status == "error") {
                                        msgprint(r.message.Response.Type)
                                        return false;
                                    }
                                    let html = '<table class="table table-striped table-bordered table-responsive">';
                                    let companies = r.message.Response.Companies;
                                    html += '<tr><th >Company CIN</th><th>Company Name</th></tr>';

                                    $.each(companies, function (key, value) {
                                        html += '<tr><td><a href="javascript:;" class="cin-link"  data-lead_id="' + frm.doc.name + '" data-cin="' + value.CompanyCIN + '"  title="Get Company Financial Details">' + value.CompanyCIN + '</a></td><td ><a href="javascript:;" class="cin-link"  data-lead_id="' + frm.doc.name + '" data-cin="' + value.CompanyCIN + '"  title="Get Company Financial Details">' + value.CompanyName + '</a></td></tr>';
                                    });
                                    html += '</table>';
                                    let d = new frappe.ui.Dialog({
                                        title: 'CIN Results',
                                        indicator: "green",
                                        fields: [
                                            {
                                                label: 'Search Result',
                                                fieldname: 'company_list',
                                                fieldtype: 'HTML'
                                            }
                                        ]
                                    });
                                    d.fields_dict.company_list.$wrapper.html(html);
                                    d.$wrapper.find('.modal-dialog').css("width", "600px");
                                    d.show();
                                    d.$wrapper.find('.cin-link').on('click', function () {
                                        let cin = $(this).data('cin');
                                        let reference_docname = $(this).data('lead_id');
                                        get_details_by_cin(cin, reference_docname);
                                        frappe.db.set_value("Lead", frm.doc.name, 'cin', cin, false);
                                        d.hide();
                                    });
                                }
                            }
                            // on success
                        }
                    });
                }
                );
            }, __("Enrich Data"));
            frm.add_custom_button(__('FinRich'), function () {
                let search_string;
                if (frm.doc.cin) {
                    get_basic_details_by_cin(frm.doc.cin, frm.doc.name);
                    return
                }
                frappe.prompt([
                    {
                        label: 'Organisation Name',
                        fieldname: 'company_name',
                        fieldtype: 'Data',
                        default: frm.doc.company_name
                    }
                ], (values) => {
                    search_string = values.company_name;
                    frappe.call({
                        method: 'journeys.journeys.doctype.finrich_request.finrich_request.get_cin_by_name',
                        args: {
                            company_name: search_string
                        },
                        // disable the button until the request is completed
                        btn: $('.primary-action'),
                        freeze_message: "<h4>Please wait, retriving data</h4>",
                        // freeze the screen until the request is completed
                        freeze: true,
                        callback: (r) => {
                            if (r.message) {
                                if (r.message.Response == null) {
                                    msgprint("Sorry, No Record Found!. Please Try with different name.");
                                    return false;
                                } else {
                                    if (r.message.Response.Status == "error") {
                                        msgprint(r.message.Response.Type)
                                        return false;
                                    }
                                    let html = '<table class="table table-striped table-bordered table-responsive">';
                                    let companies = r.message.Response.Companies;
                                    html += '<tr><th >Company CIN</th><th>Company Name</th></tr>';

                                    $.each(companies, function (key, value) {
                                        html += '<tr><td><a href="javascript:;" class="cin-link"  data-lead_id="' + frm.doc.name + '" data-cin="' + value.CompanyCIN + '"  title="Get Company Financial Details">' + value.CompanyCIN + '</a></td><td ><a href="javascript:;" class="cin-link"  data-lead_id="' + frm.doc.name + '" data-cin="' + value.CompanyCIN + '"  title="Get Company Financial Details">' + value.CompanyName + '</a></td></tr>';
                                    });
                                    html += '</table>';
                                    let d = new frappe.ui.Dialog({
                                        title: 'CIN Results',
                                        indicator: "green",
                                        fields: [
                                            {
                                                label: 'Search Result',
                                                fieldname: 'company_list',
                                                fieldtype: 'HTML'
                                            }
                                        ]
                                    });
                                    d.fields_dict.company_list.$wrapper.html(html);
                                    d.$wrapper.find('.modal-dialog').css("width", "fit-content");
                                    d.$wrapper.find('.table').css({ "margin": "20px 0px", "border-radius": "9px", "width": "max-content", "max-width": "100%", "box-shadow": "0 0.05rem 0.2rem rgb(0 0 0 / 50%)" });
                                    d.show();
                                    d.$wrapper.find('.cin-link').on('click', function () {
                                        let cin = $(this).data('cin');
                                        let reference_docname = $(this).data('lead_id');
                                        get_basic_details_by_cin(cin, reference_docname);
                                        frappe.db.set_value("Lead", frm.doc.name, 'cin', cin, false);
                                        d.hide();
                                    });
                                }
                            }
                            // on success
                        }
                    });
                }
                );
            }, __("Enrich Data"));
        });

        // let profile_enrich_settings = frappe.db.get_doc('Profile Enrich Settings');
        // profile_enrich_settings.then((profile_enrich_settings) => {
        //     if (profile_enrich_settings && !profile_enrich_settings.enable_profile_enrich) {
        //         return;
        //     }

        //     frm.add_custom_button(__('Profile Enrich'), function () {
        //         frappe.prompt([
        //             {
        //                 label: 'Email',
        //                 fieldname: 'email',
        //                 fieldtype: 'Check',
        //                 default: 1
        //             },
        //             {
        //                 label: 'Phone',
        //                 fieldname: 'phone',
        //                 fieldtype: 'Check',
        //                 default: 0
        //             },
        //         ], (values) => {
        //             let email = values.email;
        //             let mobile = values.mobile;
        //             let search_obj = {};
        //             if (email && frm.doc.email_id) {
        //                 search_obj["email"] = frm.doc.email_id
        //             }
        //             if (mobile && frm.doc.mobile_no) {
        //                 search_obj["mobile_no"] = frm.doc.mobile_no;
        //             }
        //             if (Object.keys(search_obj).length === 0) {
        //                 frappe.throw("Please Update Mobile No or Email");
        //                 return;
        //             }
        //             frappe.call({
        //                 method: 'journeys.journeys.doctype.profile_enrich_request.profile_enrich_request.get_profile_data',
        //                 args: search_obj,
        //                 // disable the button until the request is completed
        //                 btn: $('.primary-action'),
        //                 freeze_message: "<h4>Please wait, retriving data</h4>",
        //                 // freeze the screen until the request is completed
        //                 freeze: true,
        //                 callback: (r) => {
        //                     if (r.message) {
        //                         let html = make_digital_footprint(r.message)
        //                         let d = new frappe.ui.Dialog({
        //                             title: 'Person Summary',
        //                             indicator: "green",
        //                             fields: [
        //                                 {
        //                                     label: 'Search Result',
        //                                     fieldname: 'company_list',
        //                                     fieldtype: 'HTML'
        //                                 }
        //                             ]
        //                         });
        //                         d.fields_dict.company_list.$wrapper.html(html);
        //                         d.$wrapper.find('.modal-dialog').css({ "width": "80%", "max-width": "80%" });
        //                         d.show();
        //                         d.$wrapper.find('.nav-link').on('click', function () {
        //                             let id = $(this).attr('id');
        //                             let areaid = id.substring(0, id.length - 4);
        //                             d.$wrapper.find(".tab-pane").each(function (key, ele) {
        //                                 $(ele).removeClass('active');
        //                                 $(ele).removeClass('show');
        //                             });
        //                             d.$wrapper.find("#" + areaid).addClass("active show");
        //                         });
        //                     }
        //                 }
        //                 // on success

        //             });
        //         }
        //         );
        //     }, __("Enrich Data"));
        // });

        // Calling Status Message
        const urlParams = new URLSearchParams(window.location.search);
        // console.log(urlParams);
        let message=urlParams.get('message');
        if (urlParams.get('call_placed') === 'true') {
            frappe.msgprint("Call is placed. Knowlarity Message: "+message);
        }
        else if (urlParams.get('call_placed') === 'false'){
            frappe.msgprint("Call is not placed. Knowlarity Message: " + message);
        }

        // Refresh URL After Displaying Calling Status
        // console.log(urlParams.get('call_placed'))
        if(urlParams.get('call_placed')!==null)
        {
            setTimeout(function () {
                const baseUrl = new URL(window.location.href);
                baseUrl.pathname = "/";
                window.location.href = baseUrl.origin + '/app/lead/' + cur_frm.doc['name'];
            }, 6000);
        }

        // CallHistory Knowlarity
        frm.add_custom_button(__('Call Logs Knowlarity'), function () {
            frappe.set_route('List', 'Knowlarity Call Logs', { 'customer_number': ['in', fetchContactNumbers(frm)] });
        }, __('Calling'));

        // CallHippo CallHippo
        frm.add_custom_button(__('Call Logs CallHippo'), function () {
            frappe.set_route('List', 'CallHippo Call Logs', { 'to': ['in', fetchContactNumbers(frm)] });
        }, __('Calling'));

        // Calling CallHippo Option
        frm.add_custom_button("Call with CallHippo", async function(){
            clickToCall(frm, "CallHippo", 'tel:');
        } , __('Calling'));

        // Calling Knowlarity Option
        frm.add_custom_button("Call with Knowlarity", async function () {
            clickToCall(frm, "Knowlarity", '/api/method/journeys.journeys.doctype.knowlarity_call_logs.knowlarity_call_logs.make_click_to_call_knowlarity?lead_number=' + cur_frm.doc['name'] + '&customer_number=')
        }, __('Calling'));
    }
});

//
async function clickToCall(frm,method,href){

    // Fetch Contacts From Lead
    let phoneNumbers = await fetchContactNumbers(frm);
    // console.log(phoneNumbers)
    // Fetch Base Url
    if(method=="Knowlarity"){
        const baseUrl = new URL(window.location.href);
        baseUrl.pathname = "/";
        href=baseUrl.origin+href;
    }

    // List all the numbers for click to call
    let setfields = '<span>Call with '+method+':</span><br>';
    let count = 0;
    // console.log(phoneNumbers)
    if (phoneNumbers == null) {
        frappe.msgprint("Please add Mobile Number First.");
        return false;
    }
    phoneNumbers.forEach(phoneNumber => {
        count++;
        // console.log(phoneNumber);
        // console.log('<div">' +
        //     '<a href="' + href + phoneNumber.substring(1) + '">' + count + ". ClickToCall: " + phoneNumber + '</a>' +
        //     '</div><br>');
        setfields = setfields + '<div">' +
            '<a href="' + href + phoneNumber.substring(1) +'">' + count + ". ClickToCall: " + phoneNumber + '</a>' +
            '</div><br>';
    });
    var d = new frappe.ui.Dialog({
        'fields': [
            { 'fieldname': method, 'fieldtype': 'HTML' },
        ],
    });
    if(method=="Knowlarity"){
        d.fields_dict.Knowlarity.$wrapper.html(setfields)
    }
    else if(method=="CallHippo"){
        d.fields_dict.CallHippo.$wrapper.html(setfields)
    }
    d.show();
}
//Return all fetched phone numbers
function fetchContactNumbers(event){
    // console.log("Fetched")

    //Fetch All numbers
    let addButton = document.querySelectorAll('.address-box');
    // console.log(addButton, "AddButton");
    let addButtonHTML = Array.from(addButton).map(button => button.outerHTML);

    let html = addButtonHTML.join('');

    // console.log(html, "HTML");

    const phoneRegex = /\+?\d{10,}/g;
    const phoneNumbers = html.match(phoneRegex);
    // console.log(phoneNumbers, "Phoneee numbers");
    return phoneNumbers;
}