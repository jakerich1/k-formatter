let startcheck = ['00:00', '01:00', '02:00', '03:00', '04:00', '05:00', '06:00', '07:00', '08:00']
let endcheck = ['19:00', '20:00', '21:00', '22:00', '23:00', '00:00']
let timerange = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00']
let complete = []
let all = []
let resArr = []

$(document).ready(function () {

    $('textarea').bind('input', function () {
        complete = $("textarea").val().split("\n").sort().filter(function (item, pos, ary) {
            return !pos || item != ary[pos - 1]
        }).filter(item => item)
        $("#section1").hide()
        complete.forEach(element => {
            $("#exclusions").append(`${element}<br>`)
        })
        $("#section2").show()
    });

    let onDragEnter = function (event) {
            event.preventDefault()
            $(".dashline").addClass("undashed")
        },
        onDragOver = function (event) {
            event.preventDefault()
            if (!$(".dashline").hasClass("undashed"))
                $(".dashline").addClass("undashed")
        },
        onDragLeave = function (event) {
            event.preventDefault()
            $(".dashline").removeClass("undashed")
        },
        //Validation and minor handeling of uploaded file
        onDrop = function (event) {
            $(".dashline").removeClass("undashed")
            event.preventDefault()
            //console.log(event.originalEvent.dataTransfer.files);
            let filename = event.originalEvent.dataTransfer.files[0].name
            let filetype = filename.split('.').pop()
            //Check to see if the file type is correct
            if (filetype != "csv") {
                //what to do if it is not csv
                $(".errorlog").prepend("Please upload a CSV file<br>")
            } else {
                //File type correct
                //Read the file
                const reader = new FileReader()
                reader.onload = function (e) {
                    let inputdataraw = Papa.parse(e.target.result, {
                        header: true
                    });
                    inputdataraw.data.pop()
                    if (inputdataraw.meta.fields.length != 15) {
                        $(".errorlog").prepend("Incorrect number of collumns<br>")
                    } else {
                        if (inputdataraw.data.length == 0) {
                            $(".errorlog").prepend("Empty CSV<br>")
                        } else {
                            //CSV has passed validation
                            handledata(inputdataraw.data)
                        }
                    }
                };
                reader.readAsText(event.originalEvent.dataTransfer.files[0])
            }
        };

    $(".dashed-location")
        .on("dragenter", onDragEnter)
        .on("dragover", onDragOver)
        .on("dragleave", onDragLeave)
        .on("drop", onDrop)

});

function handledata(data) {
    for (let x = 0; x < data.length; x++) {
        if (contains(data[x].start_time, startcheck) || contains(data[x].end_time, endcheck) || contains(data[x].reference, complete)) {
            data.splice(x, 1, )
        }
    }
    $("#section2").hide()
    $("#section3").show()
    all = data
    createunique(data)
    checkwindows()
    all = [...all.reduce((map, obj) => map.set(obj.reference, obj), new Map()).values()]
    for (let y = 0; y < all.length; y++) {
        all[y].start_time = resArr.find(resArr => resArr.reference == all[y].reference).timewindow[0]
        all[y].end_time = resArr.find(resArr => resArr.reference == all[y].reference).timewindow[1]
    }

    $(".results").text(Papa.unparse(all))

    let csvFile = new Blob([Papa.unparse(all)], {
        type: "text/csv"
    });
    let downloadLink = document.createElement("a");
    downloadLink.download = 'k-file.csv';
    downloadLink.href = window.URL.createObjectURL(csvFile);
    downloadLink.style.display = "none";
    document.body.appendChild(downloadLink);
    downloadLink.click();

}

function contains(target, pattern) {
    var value = 0
    pattern.forEach(function (word) {
        value = value + target.includes(word)
    })
    return (value === 1)
}

function createunique(data) {
    data.forEach(function (item) {
        var i = resArr.findIndex(x => x.reference == item.reference)
        if (i <= -1) {
            resArr.push({
                reference: item.reference
            })
        }
    })
}

function checkwindows() {

    for (let x = 0; x < resArr.length; x++) {

        let tmptimeobj = []
        let tmptime = all.filter(obj => {
            return obj.reference === resArr[x].reference
        })
        tmptime.forEach(element => {
            tmptimeobj.push(timerange.indexOf(element.start_time))
        })
        resArr[x].timewindow = getmaxsequence(tmptimeobj)

    }

}

function getmaxsequence(test) {
    test.sort(function (a, b) {
        return a - b
    })
    let windows = []
    windows.push([test[0]])
    for (let x = 0; x < test.length; x++) {
        let lastarrayindex = windows.length - 1
        if (x != 0) {
            let firstindex = x - 1
            let diff = test[x] - test[x - 1]
            if (diff == 1) {
                windows[lastarrayindex].push(test[x])
            } else {
                windows.push([test[x]])
            }
        }
    }
    let lengths = []
    windows.forEach((element) => {
        lengths.push(element.length)
    });
    const indexOfMaxValue = lengths.indexOf(Math.max(...lengths))
    let data = windows[indexOfMaxValue]
    let returnarray = []
    if (data.length > 1) {
        let lastindex = data.length - 1
        returnarray = [data[0], data[lastindex]]
    } else {
        returnarray = [data[0]]
    }
    if (returnarray.length > 1) {
        returnarray[1] = returnarray[1] + 1
    } else {
        returnarray[1] = returnarray[0] + 1
    }
    returnarray[0] = timerange[returnarray[0]]
    returnarray[1] = timerange[returnarray[1]]
    return returnarray
}