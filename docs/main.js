/*
Um filósofo, quando fica com sede, tenta pegar as bebidas pra
preparar um drink. Se alguma bebida não estiver disponivel, ele
entra em espera bloqueada. E sai da espera quando algum outro
filosofo termina de beber e libera bebidas na mesa.

Quando um filosofo pega uma bebida, ele so libera ela depois que
bebe seu drink. Portanto, pra evitar deadlock, sempre antes de
pegar uma bebida o filosofo verifica se pode causar deadlock
buscando ciclo num grafo de processos e recursos.

Porém, existe uma situação que parece deadlock, mas não é. É quando
existe ciclo no grafo de processos e recursos, mas algumas bebidas
estão bloqueadas por filósofos que estão bebendo, de modo que serão
liberadas com certeza em pouco tempo, quebrando o ciclo.

Para não achar falsos deadlocks, é usado duas estruturas. Uma para
a exclusão mutua das bebidas, e outra para detecção de deadlock.
Funciona assim: quando um filósofo vai pegar uma bebida, primeiro
ele tenta reservar essa bebida pra ele. Nesse momento, a bebida
não está necessariamente na mesa (mais sobre isso adiante). Se
conseguir reservar, ele pegará a bebida assim que ela estiver na mesa.

Para reservar, primeiro a bebida precisa não estar reservada para
outro. Segundo, é preciso verificar que não causará deadlock. Uma
vez reservadas todas as bebidas necessárias, é uma questão de tempo
até ter todas elas disponíveis.

Se um filosofo tem uma bebida reservada e ela está na mesa, ele a pega
e só soltará depois que beber o drink. Uma vez que o filosofo já pegou
todas as bebidas necessárias, ele libera elas para serem reservadas
por outro filosofo e entra no estado de BEBENDO. Somente depois
que terminar de beber é que ele devolve as bebidas para a mesa.
*/


// GRAFO AUXILIAR PARA DETECCAO DE DEADLOCK
var GV = []; // GV[v] é uma lista das bebidas que o filosofo v quer reservar
var GE = []; // GE[u] responde pra qual filosofo a bebida u está reservada

reserva = function(filo,bebida){
	if(GE[bebida] == filo) return 0;
	GV[filo][bebida] = true;
	if(GE[bebida] != -1) return 0;
	delete GV[filo][bebida];
	GE[bebida] = filo;
	return 1;
}
libera = function(filo,bebida){
	if(GE[bebida] != filo) return 0;
	GE[bebida] = -1;
	return 1;
}
liberarBebidas = function(filo,bebidas){
	let cont = 0;
	for(let bebida of bebidas) cont += libera(filo,bebida);
	if(cont < bebidas.length) console.log("ALGO ERRADO ACONTECEU!",filo);
}
findDeadLock = function(vertice){ // BFS pra procurar ciclo
	let fila = new Int8Array(V); let vis = new Int8Array(V); 
	let qt = 0; fila[qt++] = vertice; vis[vertice] = 1;
	for(let i = 0; i<qt; i++){
		for(let bebida in GV[fila[i]]){
			let vizinho = GE[+bebida];
			// se o vizinho ja foi visitado, entao achou ciclo
			if(~vizinho && vis[vizinho]) return true;
			vis[vizinho] = 1;
			fila[qt++] = vizinho;
		}
	} return false;
}

// VARIAVEIS DO AMBIENTE
var contador = 0; // quantas instancias estao em execucao
var iterations = 0; // vezes que cada filosofo deve beber
var locked = []; // marcador para exclusao mutua de bebidas
var G = []; // lista de bebidas de cada filosofo
var V; // quantidade de filosofos
var E; // quantidade de bebidas
var tempos = []; // contador de tempo em cada estado
var thread = []; // array de threads de filosofos
var inicioExecucao;

showStatistics = function(){
	console.log("Tempo total: "+((new Date())-inicioExecucao)+"ms");
	for(let i=0; i<V; i++) console.log("Filosofo "+i+": "+tempos[i][0]+"ms tranquilo; "+tempos[i][1]+"ms com sede;");
}
unlock = function(filo,bebidas){
	for(let b of bebidas){ if(locked[b]!=filo) console.log("ALGO ERRADO ACONTECEU!!", filo); locked[b] = -1; }
}
pegouTodas = function(filo,bebidas){
	for(let b of bebidas) if(locked[b]!=filo) return false; return true;
}


listenToFilosopher = function(e){
	
	let id = e.data.id;

	if(e.data.key == "lock"){
		// get sortedBebidas
		
		let sortedBebidas = e.data.value;
		for(let bebida of sortedBebidas){
			if(reserva(id,bebida)){
				// se o filosofo pegando essa bebida gera deadlock, ele nao pega
				if(findDeadLock(id))
					libera(id,bebida);
				else
					if(locked[bebida] == -1) locked[bebida] = id;
			}
			else if(GE[bebida] == id && locked[bebida] == -1)
				locked[bebida] = id;
		}
		
		thread[id].postMessage({key: "lock", value: pegouTodas(id,sortedBebidas)});
		
	} else
	if(e.data.key == "liberarBebidas"){
		// get sortedBebidas
		
		liberarBebidas(id, e.data.value);
		
	} else
	if(e.data.key == "unlock"){
		// get sortedBebidas
		
		unlock(id, e.data.value);
		for(let i = 0; i<V; i++) thread[i].postMessage({key: "wake"});
		
	} else
	if(e.data.key == "sendStatistics"){
		// get tempos[3]
		
		tempos[id] = e.data.value;
		if(--contador == 0){ showStatistics(); document.querySelector("#button").disabled = false; }
		
	}
}


run = function(){
	document.querySelector("#button").disabled = true;
	console.clear();
	
	let grafo = document.querySelector("#grafo").value;
	grafo = grafo.split('\n').filter(x=>x.length).filter(x=>x[0]=="0"||x[0]=="1").map(x=>x.split("//").filter(x=>x[0]=="0"||x[0]=="1").join().split(", ").join(""));
	console.log("Matriz de adjacencias",grafo);
	
	thread = [];
	V = grafo.length;
	locked = [];
	G = []; tempos = []; GV = [];
	E = 0;
	for(let i=0; i<V; i++){ G.push([]); tempos.push([0,0,0]); GV.push({}); }
	for(let i=0; i<V; i++){
		for(let j=i+1; j<V; j++){
			if(+grafo[i][j]){
				GE[E] = -1;
				locked[E] = -1;
				G[i].push(E);
				G[j].push(E++); }}}
	iterations = V > 6 ? 3 : 6;
	console.log("Lista de adjacencias Filosofo->Bebidas", G);

	inicioExecucao = new Date();
	for(let filo = 0; filo < V; filo++){
		contador++;
		thread[filo] = new Worker("filosofo.js");
		thread[filo].onmessage = listenToFilosopher;
		thread[filo].postMessage({key: "run", value: [ filo, iterations, G[filo] ] });
	}
	console.log(GV,GE);
	console.log("running version 1.1");
}
