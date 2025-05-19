document.addEventListener('DOMContentLoaded', function() {
  const tituloElement = document.getElementById('titulo');
  const mensagemElement = document.getElementById('mensagem');
  const palpiteInput = document.getElementById('palpite');
  const enviarBotao = document.getElementById('enviar');
  const labelPalpiteElement = document.getElementById('labelPalpite');

  fetch('dados.json')
    .then(response => response.json())
    .then(data => {
      tituloElement.textContent = 'Adivinhe o Número';
      mensagemElement.textContent = data.mensagem_inicial;
      enviarBotao.textContent = data.botao_enviar;
      labelPalpiteElement.textContent = data.label_input;
    });

  const numeroAleatorio = Math.floor(Math.random() * 100) + 1;
  let tentativas = 0;

  enviarBotao.addEventListener('click', function() {
    const palpite = parseInt(palpiteInput.value);
    tentativas++;

    if (isNaN(palpite)) {
      mensagemElement.textContent = 'Por favor, digite um número válido.';
    } else if (palpite === numeroAleatorio) {
      fetch('dados.json')
        .then(response => response.json())
        .then(data => {
          mensagemElement.textContent = data.mensagem_acertou.replace('[tentativas]', tentativas);
        });
      enviarBotao.disabled = true;
    } else if (palpite > numeroAleatorio) {
      fetch('dados.json')
        .then(response => response.json())
        .then(data => {
          mensagemElement.textContent = data.mensagem_menor;
        });
    } else {
      fetch('dados.json')
        .then(response => response.json())
        .then(data => {
          mensagemElement.textContent = data.mensagem_maior;
        });
    }
    palpiteInput.value = '';
    palpiteInput.focus();
  });

  palpiteInput.addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
      enviarBotao.click();
    }
  });
});
