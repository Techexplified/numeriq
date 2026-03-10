/* global TrelloPowerUp */

window.TrelloPowerUp.initialize({
  "board-buttons": function (t, options) {
    return [
      {
        icon: "https://cdn-icons-png.flaticon.com/512/5968/5968756.png",
        text: "Numeriq",
        callback: function (t) {
          return t.popup({
            title: "Numeriq",
            url: "./index.html",
            height: 200
          });
        }
      }
    ];
  }
});