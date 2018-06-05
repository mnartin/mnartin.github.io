/**
 * Created by roppongi on 2017-03-21.
 */

var screenWidth = $(document).width();

$(document).ready(function () {
    if (screenWidth < 1000) {
        $(".startPics").mouseenter(function () {
            $(this).animate({
                width: "100px"
            }, 300);
        });
    } else
        $(".startPics").mouseenter(function () {
            $(this).animate({
                width: "300px"
            }, 100);
        });
    $(".startPics").mouseleave(function () {
        $(this).animate({
            width: "50px"
        }, 100);
    });
});

/***
 * Färgfunktionen
 ***/
$(document).mousemove(function (e) {
    var $width = ($(document).width()) / 255;
    var $height = ($(document).height()) / 255;
    var $pageX = parseInt(e.pageX / $width, 10);
    var $pageY = parseInt(e.pageY / $height, 10);
    $("#omMig").css("color", "rgb(" + 30 + $pageX + "," + $pageX + "," + $pageY + ")");
    $("#omMig").css("background-color", "rgba(" + $pageY + "," + (255 - $pageX) + "," + (255 - $pageY) + "," + 0.6 + ")");

});

