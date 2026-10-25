const select = document.querySelector("#user-type");


select.addEventListener("change", () => {
    select.classList.remove("open");
    select.blur();
});

select.addEventListener("blur", () => {
    select.classList.remove("open");
});

select.addEventListener("mouseenter", () => {
    select.classList.add("open");
});

select.addEventListener("mouseleave", () => {
    select.classList.remove("open");
    select.blur();
});