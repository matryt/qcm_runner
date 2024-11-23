export var QuestionState;
(function (QuestionState) {
    QuestionState[QuestionState["INCORRECT"] = 0] = "INCORRECT";
    QuestionState[QuestionState["PARTIALLY_CORRECT"] = 1] = "PARTIALLY_CORRECT";
    QuestionState[QuestionState["CORRECT"] = 2] = "CORRECT";
})(QuestionState || (QuestionState = {}));
