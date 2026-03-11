const form = document.getElementById("interaction-form");
const toast = document.getElementById("toast");

function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("toast--visible");

  setTimeout(() => {
    toast.classList.remove("toast--visible");
  }, 2600);
}

if (form) {
  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const protein = form.proteinName.value.trim();
    const ligand = form.ligandName.value.trim();

    if (!protein || !ligand) {
      showToast("Please fill in both Protein Name and Ligand's Name.");
      return;
    }

    if (!form.tnc.checked) {
      showToast("Please agree to the terms and conditions.");
      return;
    }

    showToast(
      `Request submitted for ${protein || "protein"} and ${
        ligand || "ligand"
      }. (Demo only)`
    );

    form.reset();
  });
}

