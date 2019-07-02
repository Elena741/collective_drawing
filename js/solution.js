let picture = document.querySelector('.current-image');
picture.style.maxWidth ='800px';

// маска
function mask() {
	imgMask = document.createElement('img');
	imgMask.classList.add('mask');
	document.querySelector('.wrap').insertBefore(imgMask, divComments);

	imgMask.style.position = 'absolute';
	imgMask.width = picture.width;
	imgMask.height = picture.height;					

	imgMask.style.top = `${picture.getBoundingClientRect().top}px`;
	imgMask.style.left = `${picture.getBoundingClientRect().left}px`;
}

// контейнеры для комментариев и рисования
const divComments = document.createElement('div');
const canvas = document.createElement('canvas');
const ctx = canvas.getContext("2d"); 
document.querySelector('.wrap').insertBefore(divComments, document.querySelector('.error'));
divComments.appendChild(canvas);

picture.src = "";

const list = document.querySelectorAll('.mode');

// создаем дубликаты дефолтной формы и удаляем ее из верскти
let formDefault = document.querySelector('.comments__form').cloneNode(true);
formDefault.querySelector('.loader').style.display = 'none';
const divComment = formDefault.querySelector('.comment');
const child = Array.from(formDefault.querySelectorAll('.comment'));

for (let i = 0; i < child.length-1; i++) {
	child[i].remove();
}

document.querySelector('.comments__form').remove();

// ------------------------------------- функции для работы с меню -----------------------------------------------

//очищаем selected
function clearSelected() {

	Array.from(list).forEach(item => item.dataset.state = "");

}

// функция выбора пункта меню
function SelectMenu(markerClass) {

	document.querySelector('.menu').setAttribute('data-state', 'selected');
	document.querySelector('.burger').setAttribute('style', 'display: inline-block;');

	Array.from(list).forEach(item => {

		item.style.display = 'none';

		if(item.classList.contains(markerClass)) {
			// item.style.display = "default";
			item.style.display = "inline-block";
			item.dataset.state = 'selected';
		}

	});

}
// ------------------------------------- движение меню по странице -------------------------------------------------
const board = document.querySelector('.wrap');
let movedPiece = null;
let minY, minX, maxX, maxY;
let shiftX = 0;
let shiftY = 0;

const dragStart = event => {

	if (event.target.classList.contains('drag')) {

		movedPiece = event.target.parentNode;
		minY = board.offsetTop + 1;
		minX = board.offsetLeft + 1;
		maxX = board.offsetLeft + board.offsetWidth - movedPiece.getBoundingClientRect().width - 1;
		maxY = board.offsetTop + board.offsetHeight - movedPiece.getBoundingClientRect().height - 1;
		shiftX = event.pageX - event.target.getBoundingClientRect().left - window.pageXOffset;
		shiftY = event.pageY - event.target.getBoundingClientRect().top - window.pageYOffset;

	}

};

const drag = throttle((x, y) => {

	if (movedPiece) {

		x = x - shiftX;
		y = y - shiftY;
		x = Math.min(x, maxX);
		y = Math.min(y, maxY);
		x = Math.max(x, minX);
		y = Math.max(y, minY);
		movedPiece.style.left = x + 'px';
		movedPiece.style.top = y + 'px';
		movedPiece.classList.add('moving');

	}

});

const drop = event => {

	if (movedPiece) {

		movedPiece.style.visibility = 'hidden';
		const check = document.elementFromPoint(event.clientX, event.clientY);
		movedPiece.style.visibility = 'visible';

		if (check) {

			check.appendChild(movedPiece);
			movedPiece.classList.remove('moving');
			movedPiece = null;

		}

	}

};

document.addEventListener('mousedown', dragStart);
document.addEventListener('mousemove', event => drag(event.pageX, event.pageY));
document.addEventListener('mouseup', drop);

function throttle(callback) {

	let isWaiting = false;

	return function () {

		if (!isWaiting) {

			callback.apply(this, arguments);
			isWaiting = true;

			requestAnimationFrame(() => {

				isWaiting = false;
			});

		}

	};

}

// ------------------------------------------ нажатия кнопок -------------------------------------------------------------
	
// клик на кнопку "загрузить новое"
let newImage = document.querySelector('.new');
newImage.addEventListener('click', loadingFile);

// клик на кнопку меню-бургер
document.querySelector('.burger').addEventListener('click', () => {

	document.querySelector('.menu').setAttribute('data-state', 'initial');

	Array.from(list).forEach(item => {

		item.setAttribute('style', 'display: inline-block;');
		item.dataset.state = '';

	});

});

// клик на кнопку комментарии
document.querySelector('.comments').addEventListener('click', () => {

	clearSelected();
	SelectMenu('comments');

});

// клик на кнопку рисование
document.querySelector('.draw').addEventListener('click', () => {

	clearSelected();
	SelectMenu('draw');

});

//клик на кнопку поделиться
document.querySelector('.share').addEventListener('click', () => {

	clearSelected();
	SelectMenu('share');

});

// клик на кнопку копировать
document.querySelector('.menu_copy').addEventListener('click', () => {

	document.querySelector('.menu__url').select();
	document.execCommand('copy');

});

// клик на кнопку показать/скрыть комментарии
Array.from(document.querySelectorAll('.menu__toggle')).forEach(item => item.addEventListener('change', () => {

	item.checked == true;
	const listForm = Array.from(document.querySelectorAll('.comments__form'));

	if (document.getElementById('comments-on').checked == true) {

		listForm.forEach(item => item.style.display = 'initial');

	} else if (document.getElementById('comments-off').checked == true) {

		listForm.forEach(item => item.style.display = 'none');
	}

}));

// ----------------------------- загрузка изображения на сервер и его отрисовка ---------------------------------------

function preloaderImage(file) {

	document.querySelector('.image-loader').setAttribute('style', 'display: initial;');

	//формируем данные для отправки изображения на сервер
	const formData = new FormData();

	formData.append('title', file.name);
	formData.append('image',  file);

	const request = fetch('https://neto-api.herokuapp.com/pic', 
		{
			body: formData,
			method: 'POST',
	})
	.then((res) => {

		if (200 <= res.status && res.status < 300) {
			return res;
		}

		throw new Error(response.statusText);
	})
	.then((res) => {return res.json()})
	.then((data) => {

		// убираем "артефакты"  от прошлого рисования

		if(document.querySelector('.mask')) {
			
			document.querySelector('.mask').style.display = 'none';
		}
				
		Array.from(document.querySelectorAll('.comments__form')).forEach(item => item.remove());

		// загружаем картинку и отрисовываем страницу

	    location.hash = data.id;
	    document.querySelector('.share-tools').querySelector('input').value = location.href;

	    renderPage('share');

	    picture.addEventListener('load', event => {

		    document.querySelector('.image-loader').setAttribute('style', 'display: none;');

		    // запрещаем повторную загрузку файла перетаскиванием
		    none = false;

	    });	    

	})
	.catch((error) => {

		console.log(error);
		document.querySelector('.image-loader').setAttribute('style', 'display: none;');
		document.querySelector('.error-loading').setAttribute('style', 'display: initial;');

	});

}

// ------------------------------------------ загрузка файлов --------------------------------------------------------

// Загрузка файла по клику кнопки
function loadingFile() {

	event.preventDefault();
	// убираем все предупреждения
	document.querySelector('.error').setAttribute('style', 'display: none;');
	document.querySelector('.recommendation').setAttribute('style', 'display: none;');

	// создаем виртульный инпут
	const input = document.createElement('input');
	input.type = "file";
	input.accept = "image/jpeg, image/png";

	// симулируем клик
	input.click(); 

	input.addEventListener('change', () => {

		preloaderImage(Array.from(event.target.files)[0]);
	})

}

// загрузка файла перетаскиванием
const container = document.querySelector('.wrap');

container.addEventListener('drop', onFileDrop);
container.addEventListener('dragover', event => event.preventDefault());

let none = true;

function onFileDrop(event) {

    event.preventDefault();
    document.querySelector('.error').setAttribute('style', 'display: none;');
    document.querySelector('.recommendation').setAttribute('style', 'display: none;');

    if(event.dataTransfer.files[0].type === 'image/jpeg' || event.dataTransfer.files[0].type === 'image/png') {

		if(none) {
			 preloaderImage(event.dataTransfer.files[0]);
		} else {
			document.querySelector('.recommendation').setAttribute('style', 'display: initial;');
		}
		
    } else {

        document.querySelector('.error').setAttribute('style', 'display: initial;');
    }

}

// рекомендация по загрузке файла

const recommendation = document.createElement('div');
recommendation.classList.add('error','recommendation');
recommendation.setAttribute('style', 'display: none;');
const h4 = document.createElement('h4');
h4.classList.add('error__header');
h4.textContent = 'Ошибка';
const p = document.createElement('p');
p.classList.add('error__message');
p.textContent = 'Чтобы загрузить новое изображение, пожалуйста, воспользуйтесь пунктом "Загрузить новое" в меню';
recommendation.appendChild(h4);
recommendation.appendChild(p);
document.querySelector('.wrap').appendChild(recommendation);

// сообщение при проблеме с сервером
const errorLoading = document.createElement('div');
errorLoading.classList.add('error','error-loading');
errorLoading.setAttribute('style', 'display: none;');
const h4Server = document.createElement('h4');
h4Server.classList.add('error__header');
h4Server.textContent = 'Ошибка';
const pServer = document.createElement('p');
pServer.classList.add('error__message');
pServer.textContent = 'Сервер временно недоступен';
errorLoading.appendChild(h4Server);
errorLoading.appendChild(pServer);
document.querySelector('.wrap').appendChild(errorLoading);

// ------------------------------------------- работа с формами -----------------------------------------------------

// формирование даты для комментария
function getDate (timestamp) {

	const date = new Date(timestamp);
	const options = {
		day: "2-digit",
		month: "2-digit",
		year: "2-digit",
		hour: "numeric",
		minute: "2-digit",
		second: "2-digit"
	};

	return date.toLocaleString("ru-RU", options);
};

// создаем комментарий
function createComments (arrayData) {

	let newRecord = divComment.cloneNode(true);
	let time = newRecord.querySelector('.comment__time');
	time.textContent = getDate(arrayData.timestamp);
	let mess = newRecord.querySelector('.comment__message');
	mess.textContent = arrayData.message;

	return newRecord;

}

// функция для отрисовки формы
function createForm (top, left) {

	let newForm = formDefault.cloneNode(true);
 	
	newForm.style.top = `${top}px`;
	newForm.style.left = `${left}px`;

	newForm.querySelector('.comments__marker-checkbox').checked = false;

	newForm.querySelector('.comments__close').addEventListener('click', () => {

		event.preventDefault();
		newForm.querySelector('.comments__marker-checkbox').checked = false;

	});

	newForm.querySelector('.comments__marker-checkbox').addEventListener('change', () => {

		event.preventDefault();

		if(newForm.querySelector('.comments__marker-checkbox').checked) {

			for(let item of document.querySelectorAll('.comments__form')) {

				item.querySelector('.comments__marker-checkbox').checked = false;
				item.style.zIndex = '';

				if(item.classList.contains('newForm')) {
					item.remove();
				}				
			}

			newForm.querySelector('.comments__marker-checkbox').checked = true;
			newForm.style.zIndex = '1000000';
		}		

	});

	newForm.querySelector('input.comments__submit').addEventListener('click', () => {

		event.preventDefault();

		if (newForm.querySelector('.comments__input').value) {

			newForm.querySelector('.loader').style.display = '';

			let message = 'message=' + encodeURIComponent(newForm.querySelector('.comments__input').value) + '&left=' + encodeURIComponent(left) + '&top=' + encodeURIComponent(top);

			let request = fetch(`https://neto-api.herokuapp.com/pic/${location.hash.replace("#", "")}/comments`, 
				{
					body: message,
					method: 'POST',
					headers: {
						'Content-Type': 'application/x-www-form-urlencoded'
				},
			})
			.then((res) => {	

				if (200 <= res.status && res.status < 300) {

					Array.from(document.querySelectorAll('.comments__form')).forEach(item => () => {
						if(item.style.top == newForm.style.top && item.style.left == newForm.style.left) {
							item.checked = true;
						}
					});	

				}
			})
			.catch((error) => {console.log(error)});

		}
	});

	return newForm;
}

// создать новую форму по клику
canvas.addEventListener('click', () => {

	if(document.querySelector('.comments').dataset.state === 'selected') {

		Array.from(document.querySelectorAll('.comments__form')).forEach(item => item.querySelector('.comments__marker-checkbox').checked = false);

		if(document.querySelector('.newForm')) {

			document.querySelector('.newForm').remove();
		}

		let createform = createForm(event.offsetY, event.offsetX);

		createform.classList.add('newForm');

		createform.querySelector('.comments__marker-checkbox').checked = true;

		createform.querySelector('.comments__marker-checkbox').disabled = true;

		function remove() {

			event.preventDefault();
			createform.remove();
		}

		createform.querySelector('.comments__close').addEventListener('click', remove);

		divComments.appendChild(createform);

		createform.querySelector('.comments__submit').addEventListener('click', () => {

			event.preventDefault();

			if (createform.querySelector('.comments__input').value) {

				createform.classList.remove('newForm');

				createform.querySelector('.comments__marker-checkbox').disabled = false;

				createform.querySelector('.comments__close').removeEventListener('click', remove);

				createform.querySelector('.comments__close').addEventListener('click', () => {

					event.preventDefault();
					createform.querySelector('.comments__marker-checkbox').checked = false;

				});	
			}

		});
	}
	
});

// -------------------------------------------- рисование на канвасе --------------------------------------------------

let curves = [];
let drawing = false;
let needsRepaint = false;
const BRUSH_RADIUS = 4;

function colorChecked() {

	const drawValue = document.querySelectorAll('.menu__color');

	for(let item of drawValue) {

		if(item.checked) {

			return item.value;			
		}
		
	}
}

// кривые и фигуры
function circle(point) {

	ctx.beginPath();
	ctx.arc(...point, BRUSH_RADIUS / 2, 0, 2 * Math.PI);
	// цвет точки
	ctx.fillStyle = colorChecked(); 
	ctx.fill();
}

function smoothCurveBetween (p1, p2) {
	// Контрольная точка Безье
	const cp = p1.map((coord, idx) => (coord + p2[idx]) / 2);
	ctx.quadraticCurveTo(...p1, ...cp);
}

function smoothCurve(points) {

	ctx.beginPath();
	ctx.lineWidth = BRUSH_RADIUS;
	// цвет линии
	ctx.strokeStyle = colorChecked();
	ctx.lineJoin = 'round';
	ctx.lineCap = 'round';

	ctx.moveTo(...points[0]);

	for(let i = 1; i < points.length - 1; i++) {
		smoothCurveBetween(points[i], points[i + 1]);
	}

	ctx.stroke();
}

// События

canvas.addEventListener("mousedown", (evt) => {

	if(document.querySelector('.draw').dataset.state === 'selected') {

		drawing = true;
		const curve = []; // создать новую кривую

		curve.push([evt.offsetX, evt.offsetY]);// добавить новую точку
		curves.push(curve); // добавить кривую в массив кривых
		needsRepaint = true;

	}

});

canvas.addEventListener("mouseup", (evt) => {

	if(document.querySelector('.draw').dataset.state === 'selected') {

		drawing = false;
	}
  
});

canvas.addEventListener("mouseleave", (evt) => {

	if(document.querySelector('.draw').dataset.state === 'selected') {

		drawing = false;
	}
  
});

canvas.addEventListener("mousemove", (evt) => {

	if(document.querySelector('.draw').dataset.state === 'selected') {

		if (drawing) {

		    // добавить точку
		    const point = [evt.offsetX, evt.offsetY];
		    curves[curves.length - 1].push(point);
		    needsRepaint = true;
		}
	}

});

// rendering
function repaint () {
	
	// очистить перед перекраской
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	curves.forEach((curve) => {

	  circle(curve[0]);
	  smoothCurve(curve);
	});
}

function tick () {

	if(needsRepaint) {

		repaint();
		needsRepaint = false;
	}

	window.requestAnimationFrame(tick);
}

tick();

// функция отрисовки страницы

function renderPage(mode) {

	const id = location.hash.replace("#", "");

	let connection = new WebSocket(`wss://neto-api.herokuapp.com/pic/${id}`);

	connection.addEventListener('open', () => {

		console.log('Вебсокет-соединение открыто');

	});

	connection.addEventListener('error', error => {  

		console.log(`Получено сообщение: ${error.data}`);
		document.querySelector('.error-loading').setAttribute('style', 'display: initial;');

	});

	connection.addEventListener('message', event => {

		let data = JSON.parse(event.data);        

	    // запрещаем повторную загрузку файла перетаскиванием
	    none = false;
	    
	    document.querySelector('.share-tools').querySelector('input').value = location.href;

	    if(data.event === "pic") {

	    	// переходим в режим коментирование
	    	SelectMenu(mode);
			let dataArray = data.pic;
			picture.src = dataArray.url;

			picture.addEventListener('load', event => {

				if(!document.querySelector('.mask') && dataArray.mask != undefined) {
					mask();
					let imgMask = document.querySelector('.mask');
					imgMask.src = dataArray.mask;

				}	

				divComments.style.position = 'absolute';
				divComments.style.width = `${picture.width}px`;
				divComments.style.height = `${picture.height}px`;
				divComments.style.top = `${picture.getBoundingClientRect().top}px`;
				divComments.style.left = `${picture.getBoundingClientRect().left}px`;

				canvas.width = picture.width;
  				canvas.height = picture.height;
				canvas.style.top = `${picture.getBoundingClientRect().top}px`;
				canvas.style.left = `${picture.getBoundingClientRect().left}px`;

			});

			const dataComments = dataArray.comments;

			// создаем формы для комментариев без дублирования

			for(let key in dataComments) {

				for(let form of Array.from(document.querySelectorAll('.comments__form'))) {

					if((form.style.top.replace('px', "") == dataComments[key].top) && (form.style.left.replace('px', "") == dataComments[key].left)) {
						
						form.remove();
					} 
				}

				let newForma = createForm(dataComments[key].top, dataComments[key].left);
				divComments.appendChild(newForma);
			}

			// добавляем комментарии в формы
			for(let key in dataComments) {

				for(let form of Array.from(document.querySelectorAll('.comments__form'))) {

					if((form.style.top.replace('px', "") == dataComments[key].top) && (form.style.left.replace('px', "") == dataComments[key].left)) {
						
						let newRecord = createComments (dataComments[key]);
						const divForm = form.querySelector('.comments__body').querySelectorAll('.comment');
						form.querySelector('.comments__body').insertBefore(newRecord, divForm[divForm.length-1]);
					}

				}

			}

		} else if(data.event === "comment") {

			// отрисовываем новый комментарий

			let forma = Array.from(document.querySelectorAll('.comments__form')).find(form => form.style.top.replace('px', "") == data.comment.top && form.style.left.replace('px', "") == data.comment.left);

			if(forma) {

				forma.querySelector('.loader').style.display = 'none';
				let newRecord = createComments (data.comment);
				const divForm = forma.querySelector('.comments__body').querySelectorAll('.comment');
				forma.querySelector('.comments__body').insertBefore(newRecord, divForm[divForm.length-1]);
				forma.querySelector('.comments__input').value = "";

			} else {

				const newForma = createForm (data.comment.top, data.comment.left);
				let newRecord = createComments (data.comment);
				const divForm = newForma.querySelector('.comments__body').querySelectorAll('.comment');
				newForma.querySelector('.comments__body').insertBefore(newRecord, divForm[divForm.length-1]);
				newForma.querySelector('.comments__input').value = "";
				divComments.appendChild(newForma);

			}

		} else if(data.event === 'mask') {

				if(!document.querySelector('.mask')) {
					mask();
					let imgMask = document.querySelector('.mask');
					imgMask.src = data.url;

					connection = new WebSocket(`wss://neto-api.herokuapp.com/pic/${id}`);

				} else {

					imgMask.src = data.url;
				}
			
		}

	});

	// отправка на сервер обновления маски

	setInterval(() => {

		if(curves.length > 0 && drawing == false) {

			canvas.toBlob(function (blob) {

			    connection.send(blob);

			});

			curves.length = 0;
			ctx.clearRect(0, 0, canvas.width, canvas.height);
		}

	}, 1000);

	connection.addEventListener('close', event => {

		connection.close(1000);	
		console.log('Вебсокет-соединение закрыто');
	  
	});

	window.addEventListener('beforeunload', () => { 

		connection.close(1000);	  
	});

}

// ------------------------------------- варианты загрузки страницы ---------------------------------------------------

// Первая загрузка страницы

if(location.hash === "") {

	document.querySelector('.menu').setAttribute('data-state', 'initial');
	document.querySelector('.burger').setAttribute('style', 'display: none;');
	
} else {

// загрузка страницы по ссылке из "поделиться"

	renderPage('comments');

}