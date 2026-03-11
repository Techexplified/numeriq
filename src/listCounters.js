function updateListCounters() {

  const lists = document.querySelectorAll(".js-list");

  lists.forEach(list => {

    const cards = list.querySelectorAll(".list-card");

    const header = list.querySelector(".js-list-name");

    if (!header) return;

    const oldBadge = list.querySelector(".numeriq-count");
    if (oldBadge) oldBadge.remove();

    const badge = document.createElement("span");
    badge.className = "numeriq-count";
    badge.style.marginLeft = "6px";
    badge.style.fontWeight = "bold";
    badge.innerText = `(${cards.length})`;

    header.appendChild(badge);

  });

}

// update repeatedly because Trello DOM changes
setInterval(updateListCounters, 1500);