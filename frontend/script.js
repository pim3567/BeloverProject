const API_URL = "";

async function saveScoreToDatabase(username, scores, type, need) {
    try {
        const response = await fetch(`${API_URL}/save-score`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user: username, score: scores, userType: type, needType: need })
        });
        const data = await response.json();
        console.log(data.message);
    } catch (error) {
        console.error("Error saving score:", error);
    }
}

let currentQuestionIndex = 0;
let currentChapter = 1;
let selectedAnswer = null;
let questions = [];
let needType = 0;
let giftAns = 0;
let result = [];
let scores = [0, 0, 0, 0, 0];
let userName = "";

fetch("questions.json")
    .then(response => response.json())
    .then(data => {
        questions = data;
        loadQuestion();
    });

fetch("result.json")
    .then(response => response.json())
    .then(data => {
        result = data;
    });

function loadQuestion() {
    const questionData = questions[currentQuestionIndex];

    if (currentChapter != questionData.chapter) {
        const chapterProgress = document.querySelectorAll(".progress-step");
        chapterProgress[currentChapter - 1].classList.remove("active");
        chapterProgress[currentChapter - 1].classList.add("complete");
        chapterProgress[questionData.chapter - 1].classList.add("active");
        const chapterTask = document.querySelectorAll(".chapter-step");
        chapterTask[currentChapter - 1].classList.remove("active");
        chapterTask[currentChapter - 1].classList.add("complete");
        chapterTask[questionData.chapter - 1].classList.add("active");

        const chapterLine = document.querySelectorAll('.line');
        if (currentChapter == 1) {
            chapterLine[0].classList.remove("first");
            chapterLine[0].classList.add("next");
        }
        
        if (currentChapter == 2) {
            chapterLine[0].classList.remove("next");
            chapterLine[0].classList.add("last");
        }

        currentChapter = questionData.chapter;

    }

    if (questionData.special == "startchapter") {
        document.getElementById("question-text").innerHTML = '<h2>Chapter ' + String(questionData.chapter) + '</h2>' + questionData.question;
        document.getElementById("image-display").src = questionData.image;
        document.getElementById("chapter-all-container").style.display = "none";
    }
    else {
        document.getElementById("chapter-all-container").style.display = "block";
        document.getElementById("question-text").innerHTML = '<p>' + questionData.question + '</p>';
        document.getElementById("image-display").src = questionData.image;
    }


    const optionsContainer = document.getElementById("options-container");
    optionsContainer.innerHTML = "";
    document.getElementById("display-errortext").innerHTML = "<br>";

    questionData.options.forEach((option, index) => {
        const button = document.createElement("button");
        button.innerText = option;
        button.classList.add("option");
        button.addEventListener("click", () => selectOption(button, index));
        optionsContainer.appendChild(button);
    });
}

function selectOption(button, index) {
    document.querySelectorAll(".option").forEach(btn => btn.classList.remove("selected"));
    button.classList.add("selected");
    selectedAnswer = index;
}

document.getElementById("next-btn").addEventListener("click", () => {
    if (selectedAnswer !== null) {
        let scoresAnswer = questions[currentQuestionIndex].scores[selectedAnswer];

        if (questions[currentQuestionIndex].special) {
            if (questions[currentQuestionIndex].special == "asktype")
                needType = selectedAnswer;
            else if (questions[currentQuestionIndex].special == "askgift")
                giftAns = selectedAnswer;
        }

        for (let i = 0; i < scores.length; i++) {
            scores[i] += scoresAnswer[i];
        }

        currentQuestionIndex++;
        if (currentQuestionIndex < questions.length) {
            loadQuestion();
            selectedAnswer = null;
        } else {
            displayResult();
        }
    } else {
        if (questions[currentQuestionIndex].special == "startchapter") {
            currentQuestionIndex++;
            loadQuestion();
            selectedAnswer = null;
        }
        else
            document.getElementById("display-errortext").innerHTML = 'กรุณาเลือกคำตอบก่อนกดถัดไป';
    }
});

function analysScore() {
    let maxScoreIndex = 0;
    let result = [[], [], []];
    for (let i = 0; i < scores.length; i++) {
        if (scores[i] >= 50) {
            result[1].push(i);
            if (scores[i] > scores[maxScoreIndex])
                maxScoreIndex = i;
            else if (scores[i] == scores[maxScoreIndex]) {
                if (i == needType || maxScoreIndex == needType)
                    maxScoreIndex = needType;
                else if (i == giftAns || maxScoreIndex == giftAns)
                    maxScoreIndex = giftAns;
            }
        }
        else
            result[2].push(i);
    }
    
    if(result[1].length==0)
        result[0].push(4);
    else
        result[0].push(maxScoreIndex);
    return result;
}

function clearDisplay() {
    document.getElementById("progress-container").style.display = "none";
    document.getElementById("chapter-container").style.display = "none";
    document.getElementById("quiz-container").style.display = "none";
    document.getElementById("chapter-container").style.display = "none";
}

function displayResult() {
    let userResult = analysScore();
    saveScoreToDatabase(userName, scores, userResult[0][0], needType);

    clearDisplay();
    document.getElementById("result-container").style.display = "block";
    const textType = ('"' + userName + 'เป็น' + result[userResult[0]].type + '"').replace(/\s+/g, "");
    document.getElementById("type-name").innerText = textType;
    document.getElementById("image-result-display").src = result[userResult[0]].image;
    document.getElementById("predict-percent-match").innerHTML = "คุณมีโอกาสสมหวัง<br><h2 id=\"percent-number\">" + scores[needType] + "%</h2>";

    let textResult = "คุณเป็นคน";
    if (userResult[1].length == 0) {
        textResult = result[4].positiveDetail;
    }
        
    else {
        for (let i = 0; i < userResult[1].length; i++) {
            if (i == userResult[1].length - 1 && i != 0)
                textResult += " และ";
            else if (i != 0)
                textResult += " ";
            textResult += result[userResult[1][i]].positiveDetail;
        }
        for (let i = 0; i < userResult[2].length; i++) {
            if (userResult[2][i] == 4) continue;
            if (i == userResult[2].length - 1 && i != 0)
                textResult += " และ";
            else if (i != 0)
                textResult += " ";
            else
                textResult += " แต่ในบางครั้งคุณอาจ";
            textResult += result[userResult[2][i]].negativeDetail;
        }
    }

    updateProgress(scores);

    document.getElementById("result-text").innerText = textResult;


    let suggest = "";
    if (scores[needType] >= 80) { suggest = "เราขอแนะนำให้คุณไปไหว้พระแม่ลักษมีเพื่อให้ความรักของคุณแน่นแฟ้นขึ้นไปอีก" }
    else if (scores[needType] >= 50) { suggest = "เราขอแนะนำให้คุณไปไหว้พระแม่ลักษมี ให้ช่วยเรื่องความสัมพันธ์ของคุณให้ดียิ่งขึ้นไปอีก" }
    else { suggest = "เราขอแนะนำให้คุณไปไหว้พระแม่ลักษมีเพื่อเสริมดวงเรื่องความรัก" }
    document.getElementById("mu-suggestion").innerText = suggest;

}

document.getElementById("showdetail-btn").addEventListener("click", () => {
    let currentDisplay = document.getElementById("result-detail").style.display;
    if (currentDisplay == "block") {
        document.getElementById("result-detail").style.display = "none";
        document.getElementById("showdetail-btn").innerHTML = 'อ่านรายละเอียดเพิ่มเติม <i class="fa fa-caret-down" style="margin-left: 8px;"></i>';

    }
    else {
        document.getElementById("result-detail").style.display = "block";
        document.getElementById("showdetail-btn").innerHTML = 'ซ่อนรายละเอียดเพิ่มเติม <i class="fa fa-caret-up" style="margin-left: 8px;"></i>';
    }
});

document.getElementById("restart-btn").addEventListener("click", () => {
    location.reload();
});


document.getElementById("share-btn").addEventListener("click", () => {
    document.getElementById("share-modal").style.display = "flex";
});

document.querySelector(".close").addEventListener("click", () => {
    document.getElementById("share-modal").style.display = "none";
});

// Copy Link
document.getElementById("copy-link").addEventListener("click", () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
        alert("ลิงก์ถูกคัดลอกแล้ว!");
    });
});

// Share to Facebook
document.getElementById("share-facebook").addEventListener("click", () => {
    const url = window.location.href;
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, "_blank");
});

// Share to X (Twitter)
document.getElementById("share-twitter").addEventListener("click", () => {
    const url = window.location.href;
    const text = "ลองเล่นเกมตอบคำถามนี้ดูสิ!";
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, "_blank");
});

// Save Image (Takes screenshot of the quiz result)
document.getElementById("save-image").addEventListener("click", () => {
    html2canvas(document.getElementById('photo')).then(canvas => {
        let link = document.createElement("a");
        link.download = "quiz_result.png";
        link.href = canvas.toDataURL();
        link.click();
    });
});

document.getElementById("showcredit-btn").addEventListener("click", () => {
    let currentDisplay = document.getElementById("credit-detail").style.display;
    if (currentDisplay == "block") {
        document.getElementById("credit-detail").style.display = "none";
    }
    else {
        document.getElementById("credit-detail").style.display = "block";
    }
});

document.getElementById("start-btn").addEventListener("click", () => {
    if(document.getElementById("username-input-box").value == "") {
        document.getElementById("display-errortext-start").innerHTML = "กรุณาใส่ชื่อของคุณ";
    }
    else {
        userName = document.getElementById("username-input-box").value;
        document.getElementById("start-page-container").style.display = "none";
        document.getElementById("progress-container").style.display = "flex";
        document.getElementById("quiz-container").style.display = "block";
        document.getElementById("chapter-container").style.display = "flex";
    }
});

function updateProgress(values) {
    const circles = document.getElementsByClassName("progress-circle");
    const texts = document.getElementsByClassName("progress-text");

    for(let i=0;i<values.length-1;i++){
        const maxOffset = 314;
        const newOffset = maxOffset * (1 - values[i] / 100);

        circles[i].style.strokeDashoffset = newOffset;
        texts[i].textContent = values[i] + "%";
    }
    
}

let iconmusic = "";
function seticonmusic() {
    var btn = document.getElementById("musicplayer");
    var music = document.getElementById("music");
    if(music.paused){
        btn.classList.add("fa-volume-mute");
        iconmusic="fa-volume-up";
    }
        
    else {
        btn.classList.add("fa-volume-up");
        iconmusic="fa-volume-mute";
    }
}

function controlMusic(btn) {
    var music = document.getElementById("music");
    btn.classList.toggle(iconmusic);
    if(music.paused){
        music.play();
    }
    else {
        music.pause();
    }
         
}
