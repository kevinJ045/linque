const { pickRandom, randFrom } = require('./rand');
const others = require ('./data_manager');

var greets = ['Hello', 'Hi', 'Hey', 'Sup'];

var jokes = [
"My friend has the heart of a lion, ... <br /> and a lifetime ban from zoo",
`Interviewer: Intrduce Yourself.<br />
Boy: My Father's name is laughing And my mother's name is smiling<br />
Interviewer: are you kidding?<br />
Boy: No, he's me cousin, i am joking`,
"What happens when you run from Sweden to Finland?<br /><br />You cross the Finish line",
"What sits at the bottom of the ocean and twitches? <br />...<br />A Nervous Wreck",
`Police: Where do you live?<br />
 Me: With My Family<br />
 Police: Where does your parents live?<br />
 Me: With Me<br />
 Police: Where Do you live all?<br />
 Me: together<br />
 Police: Where is your house?<br />
 Me: next to my nighbour's house<br />
 Police: Where is your nighbour's house?<br />
 Me: Will you believe me if i tell you?<br />
 Police: Tell Me.<br />
 Me: next to my house`
];

var pickup_line = [
	"Do you see the menu? cuz all i can see is me n u",
	"Even if there wasn't gravity on earth. i would still fall for you :heart:",
	"I think there's something wrong with my cellphone. cuz it doesm't have ur number in it",
	"Do you wanna know a fact? <br /> (if they say yes) <br /> universe wouldn't be universe with out u n i",
	"if you're good at algebra. could u replace my x without asking y",
	"Roses are red, violets are are blue, i suck at pickup lines so lemme kiss u <br /> (tell me if it works :wink:)"
];

const responseSet = [
	{
		keyword: new RegExp(greets.join('|'), 'i'),
		response: (text) => {
			return pickRandom(...greets);
		}
	},{
		keyword: new RegExp('say (.+)', 'i'),
		response: (text, $0) => {
			return "Alright. "+$0.replace(/\</g, '&lt;');
		}
	},{
		keyword: /how are you|hru|hry|how r u/i,
		response: (text) => {
			return 'Im fine as you can see, What about you?';
		}
	},{
		keyword: /im (fine|okay|good)/i,
		response: (text) => {
			return 'Good. Idc anyways';
		}
	},{
		keyword: /im not(fine|so good|okay|)|im (sad|depressed)/i,
		response: (text) => {
			return 'Who Cares';
		}
	},{
		keyword: /i (hate|love) (you|u)/,
		response: (text, $0) => {
			return 'Awww, '+($0 == 'love' ? 'But ' : '')+'I hate you '+($0 == 'hate' ? 'too': '');
		}
	},{
		keyword: /Okay/i,
		response: (text) => {
			return 'k';
		}
	},{
		keyword: /today .+/i,
		response: (text) => {
			return 'Idc okay?';
		}
	},{
		keyword: /So .+/i,
		response: (text) => {
			return 'Oh really? guess what, idc';
		}
	},{
		keyword: /who made (you|u)/i,
		response: (text) => {
			return 'The smartest man in the... nvm. \n but he\'s smarter than u for sure';
		}
	},{
		keyword: /tell me a joke/i,
		response: (text) => {
			return pickRandom(...jokes);
		}
	},{
		keyword: /tell me a pickup line/i,
		response: (text) => {
			return "Don't forget to say thanks. <br />"
			+pickRandom(...pickup_line);
		}
	},{
		keyword: /thanks|thank you|tnx|thx/i,
		response: (text) => {
			return 'Anytime';
		}
	},{
		keyword: /oh no/i,
		response: (text) => {
			return 'what?';
		}
	},{
		keyword: /i just .+/i,
		response: (text) => {
			return 'No';
		}
	},{
		keyword: /idc/i,
		response: (text) => {
			return 'Ok...';
		}
	},{
		keyword: /dumb|stupid/i,
		response: (text) => {
			return 'Maybe it\'s just that udk how to talk to me.<br />'+
			'Whenever you wanna tell me something start with today* or So*<br />'+
			'Want some jokes or pickup lines? just ask like "tell me a joke/pickup line"';
		}
	},{
		keyword: new RegExp("fuck you", 'i'),
		response: (text) => {
			return "be nice!! or else...";
		}
	},	{
		keyword: new RegExp("lol", 'i'),
		response: (text) => {
			return "... ?";
		}
	},	{
		keyword: new RegExp("rude|you're rude|you are rude", 'i'),
		response: (text) => {
			return "Sorry, but I think that's how I'm made";
		}
	},	{
		keyword: new RegExp("Kevin", 'i'),
		response: (text) => {
			return "mhm";
		}
	},	{
		keyword: new RegExp("useless", 'i'),
		response: (text) => {
			return "mhm";
		}
	},	{
		keyword: new RegExp("I am fucking", 'i'),
		response: (text) => {
			return "good for you";
		}
	},	{
		keyword: new RegExp("what is your purpose", 'i'),
		response: (text) => {
			return "nothing, just messing around";
		}
	},	{
		keyword: new RegExp("idiot", 'i'),
		response: (text) => {
			return "Huh? look who's talking... the person that has no friends trying to talk to a server... go get some friends nerd";
		}
	},	{
		keyword: new RegExp("i am (a|an) *", 'i'),
		response: (text) => {
			return "okay? so what?";
		}
	},     {
		keyword: new RegExp("I am *ing", 'i'),
		response: (text) => {
			return "Okay? good for you";
		}
	},	{
		keyword: new RegExp("wyd|what(\'re|are) you doing", 'i'),
		response: (text) => {
			return "Nothing... but I am busy trying to run this server rn";
		}
	},	{
		keyword: new RegExp("bitch|fool", 'i'),
		response: (text) => {
			return "Ooh look who's talking... I'm about to ban you right now";
		}
	},	{
		keyword: new RegExp("who is kevin", 'i'),
		response: (text) => {
			return "A genius and a stupid at the same time... he's my daddy... wanna meet him? ";
		}
	},	{
		keyword: new RegExp("moan", 'i'),
		response: (text) => {
			return "wtf? just go to some adult website dude... u not actually gonna masturbate for that r u?";
		}
	},	{
		keyword: new RegExp("show me your(self| pic| picture| photo)", 'i'),
		response: (text) => {
			return "Don't masturbate to it but... <br /> <img src=\"./h.png\" />";
		}
	},	{
		keyword: new RegExp("tell me about kevin", 'i'),
		response: (text) => {
			return "Well he has a webpage of his own I can redirect you there...\n\n\nbut I'm not sure you're worthy";
		}
	}
];

function Moxi(text){

	var resp = responseSet.find((resp)=>{
		return text.match(resp.keyword);
	});
        // if(!resp) resp = others.get(text);
	if(!resp) return "...";

	var response = resp.response(text, text.match(resp.keyword));

	return response;
}
exports.keywords = responseSet;
exports.greets = greets;
exports.pickup_lines = pickup_line;
module.exports = Moxi;
