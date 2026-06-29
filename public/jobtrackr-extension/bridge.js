const params = new URLSearchParams(window.location.search);
const payload = JSON.parse(params.get('data') || '{}');
const { baseUrl, ...fields } = payload;

const form = document.getElementById('f');
form.action = `${baseUrl}/applications/import`;

for (const [name, value] of Object.entries(fields)) {
  const input = document.createElement('input');
  input.type = 'hidden';
  input.name = name;
  input.value = value ?? '';
  form.appendChild(input);
}

form.submit();