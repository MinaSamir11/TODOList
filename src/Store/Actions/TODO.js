import * as types from './types';

import ApiConstant, {Api} from '../../Utils/Api';

import TODOModel from '../../Model/TODOModel';
const setToDoList = (ToDo) => {
  return {
    List: ToDo,
    type: types.GET_TODO,
  };
};

const setToDoUpdatedList = (ToDo) => {
  return {
    List: ToDo,
    type: types.SET_UPDATED_TODO,
  };
};

const check_TodaytaskDate = (date) => {
  const today = new Date();

  const year = date.substring(0, 4);
  const Months = date.substring(5, 7);
  const day = date.substring(8, 10);

  return (
    day === today.getDate().toString() &&
    Months === '0' + (today.getMonth() + 1) &&
    year === today.getFullYear().toString()
  );
};

const Filter_TodayTasks = (List) => {
  let temp = [];
  for (let i = 0; i < List.length; i++) {
    if (check_TodaytaskDate(List[i]['created'])) {
      temp.push(List[i]);
    }
  }
  return temp;
};

const check_DateEquality = (dateArray) => {
  return (
    dateArray[0].substring(0, 4) === dateArray[1].substring(0, 4) &&
    dateArray[0].substring(5, 7) === dateArray[1].substring(5, 7) &&
    dateArray[0].substring(8, 10) === dateArray[1].substring(8, 10)
  );
};

export const get_TODOlist = () => {
  return async (dispatch) => {
    //need header Authorization in first param , "Relative url" , ToDo data

    let TODOListRequest = await Api.get(true, ApiConstant.Todo);

    if (TODOListRequest) {
      //error
      if (TODOListRequest.response) {
        // Request made and server responded
        console.log(TODOListRequest.response.data);
        console.log(TODOListRequest.response.status);
        console.log(TODOListRequest.response.headers);
        dispatch(
          setToDoList({
            Status: TODOListRequest.response.status,
          }),
        );
      } else if (TODOListRequest.status == 200) {
        console.log('API token', TODOListRequest);

        let TodayTasks = Filter_TodayTasks(TODOListRequest.data);

        dispatch(
          setToDoList({
            ToDoList: TODOListRequest.data,
            TodayTODOList: TodayTasks,
            Status: TODOListRequest.status,
          }),
        );
      } else if (TODOListRequest.status == undefined) {
        console.log('Ress', TODOListRequest.status);
        dispatch(
          setToDoList({
            Status: 408,
          }),
        );
      }
    } else {
      console.log('Error ', TODOListRequest.response.status);
      dispatch(
        setToDoList({
          Status: 408,
        }),
      );
    }
  };
};

export const Create_TODO = (TODOTask) => {
  return async (dispatch, getState) => {
    let myJson = JSON.stringify(TODOTask);
    //need header Authorization in first param , "Relative url" , ToDo data
    let CreateTODORequest = await Api.post(true, ApiConstant.Todo, myJson);

    if (CreateTODORequest) {
      //error
      if (CreateTODORequest.response) {
        // Request made and server responded
        console.log(CreateTODORequest.response.data);
        console.log(CreateTODORequest.response.status);
        console.log(CreateTODORequest.response.headers);
        dispatch(
          setToDoUpdatedList({
            Status: CreateTODORequest.response.status,
          }),
        );
      } else if (CreateTODORequest.status == 201) {
        let ToDoList = [...getState().TODO.ToDoList];
        let TodayTasks = [...getState().TODO.TodayTODOList];

        if (check_TodaytaskDate(CreateTODORequest.data['created'])) {
          TodayTasks.push(CreateTODORequest.data);
        }
        ToDoList.push(CreateTODORequest.data);

        dispatch(
          setToDoUpdatedList({
            ...ToDoList,
            TodayTODOList: TodayTasks,
            Status: CreateTODORequest.status,
          }),
        );
      } else if (CreateTODORequest.status == undefined) {
        console.log('Ress', CreateTODORequest);
        dispatch(
          setToDoUpdatedList({
            Status: 408,
          }),
        );
      }
    } else {
      dispatch(
        setToDoUpdatedList({
          Status: 408,
        }),
      );
    }
  };
};

export const Update_TODO = (newTODOTask, OldTODOTask) => {
  return async (dispatch, getState) => {
    let myJson = JSON.stringify(newTODOTask);
    //need header Authorization in first param , "Relative url" , ToDo data
    let UpdateTODORequest = await Api.patch(
      true,
      ApiConstant.Todo.concat(OldTODOTask['id'] + '/'),
      myJson,
    );

    if (UpdateTODORequest) {
      //error
      if (UpdateTODORequest.response) {
        // Request made and server responded
        console.log(UpdateTODORequest.response.data);
        console.log(UpdateTODORequest.response.status);
        console.log(UpdateTODORequest.response.headers);
        dispatch(
          setToDoUpdatedList({
            Status: UpdateTODORequest.response.status,
          }),
        );
      } else if (UpdateTODORequest.status == 200) {
        let ToDoList = [...getState().TODO.ToDoList];
        let TodayTasks = [...getState().TODO.TodayTODOList];
        if (
          check_DateEquality([
            OldTODOTask['created'],
            UpdateTODORequest.data['created'],
          ]) ||
          OldTODOTask['completed'] !== UpdateTODORequest.data['completed']
        ) {
          // if user change conent only without date updated content in array Today

          let objIndex = TodayTasks.findIndex(
            (obj) => obj['id'] == OldTODOTask['id'],
          );

          TodayTasks[objIndex] = new TODOModel(UpdateTODORequest.data);
          console.log('Edit Content');
        } else if (
          !check_TodaytaskDate(OldTODOTask['created']) &&
          check_TodaytaskDate(UpdateTODORequest.data['created'])
        ) {
          // if user update date to today add this task in array today
          TodayTasks.push(UpdateTODORequest.data);
          console.log('Add new ');
        } else if (
          check_TodaytaskDate(OldTODOTask['created']) &&
          !check_TodaytaskDate(UpdateTODORequest.data['created'])
        ) {
          // if user change today task to another day remove it from array today
          let filtered = TodayTasks.filter(function (item, index, arr) {
            return item['id'] !== UpdateTODORequest.data['id'];
          });
          TodayTasks = [...filtered];
          console.log('filtered');
        }
        console.log('New last', UpdateTODORequest.status);
        ToDoList.push(UpdateTODORequest.data);

        if (OldTODOTask['completed'] !== UpdateTODORequest.data['completed']) {
          dispatch(
            setToDoList({
              ...ToDoList,
              TodayTODOList: TodayTasks,
              Status: UpdateTODORequest.status,
            }),
          );
        } else {
          dispatch(
            setToDoUpdatedList({
              ...ToDoList,
              TodayTODOList: TodayTasks,
              Status: UpdateTODORequest.status,
            }),
          );
        }
      } else if (UpdateTODORequest.status == undefined) {
        console.log('Time OUT', UpdateTODORequest);
        dispatch(
          setToDoUpdatedList({
            Status: 408,
          }),
        );
      }
    } else {
      dispatch(
        setToDoUpdatedList({
          Status: 408,
        }),
      );
    }
  };
};

export const Delete_TODO = (id, date) => {
  return async (dispatch, getState) => {
    //need header Authorization in first param , "Relative url"
    let DeleteTODORequest = await Api.delete(
      true,
      ApiConstant.Todo.concat(id + '/'),
    );

    if (DeleteTODORequest) {
      //error
      if (DeleteTODORequest.response) {
        // Request made and server responded
        console.log(DeleteTODORequest.response.data);
        console.log(DeleteTODORequest.response.status);
        console.log(DeleteTODORequest.response.headers);
        dispatch(
          setToDoUpdatedList({
            Status: DeleteTODORequest.response.status,
          }),
        );
      } else if (DeleteTODORequest.status == 204) {
        let ToDoList = [...getState().TODO.ToDoList];
        let TodayTasks = [...getState().TODO.TodayTODOList];
        if (check_TodaytaskDate(date)) {
          // if user change today task to another day remove it from array today
          let filtered = TodayTasks.filter(function (item, index, arr) {
            return item['id'] !== id;
          });
          TodayTasks = [...filtered];
          console.log('filtered');
        }

        dispatch(
          setToDoList({
            ...ToDoList,
            TodayTODOList: TodayTasks,
            Status: DeleteTODORequest.status,
          }),
        );
      } else if (DeleteTODORequest.status == undefined) {
        console.log('Time OUT', DeleteTODORequest);
        dispatch(
          setToDoUpdatedList({
            Status: 408,
          }),
        );
      }
    } else {
      dispatch(
        setToDoUpdatedList({
          Status: 408,
        }),
      );
    }
  };
};
