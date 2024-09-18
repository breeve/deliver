package command

import (
	"github.com/breeve/deliver/pkg/terminal/utils/command"
)

func RootGroup() (root *command.Group, err error) {
	return command.NewGroup(), nil
}
