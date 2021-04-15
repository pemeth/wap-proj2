function success() {
    const data = JSON.parse(this.responseText);
    $("#foo").html(this.responseText);
}

$(document).ready(function(){
    $("#send_request").click(function() {
        let url = "http://localhost:3000";
        const type = $("#type_select option:selected").val();
        url = url.concat("/");
        url = url.concat(type);
        const country = $("#country_select option:selected").val();
        url = url.concat("/");
        url = url.concat(country);

        const xhr = new XMLHttpRequest();
        xhr.onload = success;
        xhr.onerror = function() {console.log("API CALL ERROR");};

        xhr.open('GET', url.concat(""));
        xhr.send();
    });
});