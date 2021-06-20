<script>
  import AutoComplete from "simple-svelte-autocomplete";
  const colorList = [
    { id: 1, name: "White", code: "#FFFFFF" },
    { id: 2, name: "Red", code: "#FF0000" },
    { id: 3, name: "Yellow", code: "#FF00FF" },
    { id: 4, name: "Green", code: "#00FF00" },
    { id: 5, name: "Blue", code: "#0000FF" },
    { id: 6, name: "Black", code: "#000000" },
  ];

  let selectedColorObject;
  let selectedColorValue;

  const opts = {
    items: colorList,
    labelFieldName: "name",
    valueFieldName: "id",
    hideArrow: true,
    multiple: true,
    inputClassName: "Jeff",
  };
  let selectedCountry;
  async function searchCountry(keyword) {
    const url =
      "https://restcountries.eu/rest/v2/name/" +
      encodeURIComponent(keyword) +
      "?fields=name;alpha2Code";

    const response = await fetch(url);
    return await response.json();
  }
</script>

<AutoComplete
  {...opts}
  bind:selectedItem={selectedColorObject}
  bind:value={selectedColorValue}
  keywordsFunction={(color) => color.name + " " + color.code}
/>



