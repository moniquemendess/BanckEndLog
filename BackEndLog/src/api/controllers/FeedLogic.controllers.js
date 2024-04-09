//----------------------------------------(Importaciones)----------------------------------------------------------------------

const User = require("../models/User.model.js");
const FeedLogic = require("../models/FeedLogic.model.js");
const Comment = require("../models/Comment.model.js");

//----------------------------------------(Create Logic)------------------------------------------------------------------------

const createFeedLogic = async (req, res) => {
  try {
    console.log("Usuario:", req.user);
    const feedLogic = new FeedLogic({
      content: req.body.content,
      owner: req.user._id,
    });

    // Aguarda hasta con el feedLogic es salvo en el banco de datos antes de continuar con la ejecución abajo de codigos
    await feedLogic.save();

    // Recupera el documento populado con los detalles del usuario
    const feedLogicPopulated = await FeedLogic.findById(feedLogic._id).populate(
      "owner"
    );

    // Atualize o array de feeds no objeto do usuário
    const user = await User.findById(req.user._id);
    user.logicFeedOwner.push(feedLogic._id); // Adiciona o ID do logicFeedOwner al array de usuario
    await user.save(); // Salva as alterações no banco de dados

    res.status(200).send({
      message: "Logica creada con suceso!",
      feedLogic: feedLogicPopulated,
    });
  } catch (e) {
    console.error(e);
    res.status(500).send({ message: "Error al cargar la lógica" });
  }
};

//----------------------------------------(Get All Feed Logic)-------------------------------------------------------------------

const getAllFeedLogic = async (req, res) => {
  try {
    const data = await FeedLogic.find({});
    res.status(200).send(data);
  } catch (e) {
    res.status(500).send({ message: "Error al cargar las lógicas" });
  }
};

//----------------------------------------(Get by id Feed Logic)-------------------------------------------------------------------

const getByIdFeedLogic = async (req, res) => {
  try {
    const { id } = req.params; // id de la logica por params
    const byIdFeedLogic = await FeedLogic.findById(id);
    res.status(200).json(byIdFeedLogic);
  } catch (error) {
    res.status(404).json({ message: "Logica no encontrada" });
  }
};

//----------------------------------------(Delete Feed Logic)-------------------------------------------------------------------

const deleteFeedLogic = async (req, res, next) => {
  try {
    const { id } = req.params; // Obtener el ID del la logica a ser eliminada
    const feedOnwer = req.user._id; // Obtener el ID del usuario autenticado

    const feedLogic = await FeedLogic.findById(id); // Encontrar la logica en la base de datos para continuar ...

    // si no tienes logica o si el usuario autententicado no es el owner de la logica de feed
    if (!feedLogic || !feedLogic.owner.equals(feedOnwer)) {
      return res.status(404).json({
        message: "La logica no existe o no tienes permiso para eliminarlo",
      });
    }

    // Actualizar las referencias en otros modelos de datos si es necesario
    await User.updateMany(
      { logicFeedOwner: id },
      { $pull: { logicFeedOwner: id } }
    );
    await Comment.updateMany(
      { recipientFeedLogic: id },
      { $pull: { recipientFeedLogic: id } }
    );

    // Eliminar todos los comentarios en la logica
    await Comment.deleteMany({ recipientFeedLogic: id });

    // Eliminar la logica
    await FeedLogic.findByIdAndDelete(id);

    return res.status(200).json({
      message: "Logica eliminada correctamente",
      user: req.user._id,
    });
  } catch (error) {
    return res.status(500).json({
      error: "Error al eliminar la logica",
      message: error.message,
    });
  }
};
//----------------------------------------(Exportaciones)------------------------------------------------------------------------

module.exports = {
  createFeedLogic,
  getAllFeedLogic,
  getByIdFeedLogic,
  deleteFeedLogic,
};
